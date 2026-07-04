# RetroVault MVP 实施计划

> 日期：2026-07-04  
> 状态：已批准  
> 基础：PRD v2.0 + 项目初始化分析

---

## 一、当前项目状态

### 已有基础设施
| 层 | 状态 | 说明 |
|---|---|---|
| Nuxt 4 + SSR | ✅ | Cloudflare preset 已配置 |
| Tailwind CSS v4 | ✅ | 设计系统完整（暗/亮主题，Indigo 强调色）|
| UI 组件库 | ✅ | BaseButton/Input/Select/Badge/Tag/Toast/Skeleton |
| 布局组件 | ✅ | AppHeader/Footer/Sidebar/MobileTabBar/ThemeToggle/NavItem |
| Composables | ✅ | useApi/useAuth/useToast/useTheme/usePageSeo/useKeyboardShortcuts/useMarkdown |
| SEO 套件 | ✅ | @nuxtjs/seo（sitemap/robots/OG image）|
| 爬虫数据 | ✅ | 2324 款游戏元数据，独立 JSON 文件 |
| 封面图 | ✅ | 已下载至 retrovault-scraper/data/covers/ |
| EJS 配置 | ✅ | ejs_config.json 含 1061 款游戏的核心映射 |
| ROM 映射 | ✅ | rom_map.json 含下载状态追踪 |

### 需要新建
- `/games/[slug]` 游戏详情页
- EmulatorJS 全屏模拟器组件
- 游戏卡片组件（封面 + Play + Queue）
- 首页（替换 starter 模板）
- FAB 组件 + 队列系统
- 游戏历史 + 进度保存

---

## 二、MVP 阶段拆分

### Phase 0 — 数据接入（Estd: 0.5 天）
**目标**：让爬虫数据被 Nuxt 读取，不走 D1。

**做法**：
1. 将 retrovault-scraper/data/ 下的核心文件拷贝/链接到 Nuxt 可访问位置
2. 在 `public/data/` 下准备游戏数据（all_games.json 的子集或单游戏 JSON）
3. 将 retrovault-scraper/data/roms/ 链接到 `public/roms/` 供 EmulatorJS 加载

**架构决策**：静态 JSON（`$fetch('/data/...')`），不上 D1，不上 server route。MVP 最快路径。

### Phase 1 — 核心：游戏加载与运行（Estd: 1-2 天）
**目标**：跑通「打开游戏详情页 → 点 Play → 全屏运行」完整链路。

**组件**：
1. **类型定义** — `types/game.ts`：Game、EJSConfig、LocalRom 等接口
2. **游戏详情页** — `pages/games/[slug].vue`
   - 通过 slug 从 `/data/games/${slug}.json` 加载
   - 封面图（public/data/covers/）
   - 游戏名、平台、年份、类型、开发商
   - Play Now 按钮
3. **EmulatorJS 组件** — `components/game/GameEmulator.vue`
   - CDN 加载 EmulatorJS（已确认用户选择）
   - 根据 `game.ejs.core` 选择核心
   - 从 `game.defaultRom` 加载 ROM
   - 全屏模式（fixed 定位，填充视口）
   - 顶栏：游戏名 + 暂停/继续 + 关闭

**成功标准**：访问 `/games/007-everything-or-nothing-gba` → 点 Play → 全屏运行 GBA 游戏可玩。

### Phase 2 — 游戏卡片 + 列表页（Estd: 1 天）
**目标**：可浏览游戏库，不只看详情页。

**组件**：
1. **游戏卡片** — `components/game/GameCard.vue`
   - 封面（正方形，圆角，emoji 占位兜底）
   - ▶ Play 按钮（绿色，右上角）
   - + Queue 按钮（预留，MVP 暂不实现）
   - 游戏名 + 平台/年份
   - Tap 卡片 → 导航至详情页
2. **游戏列表页** — `pages/games/index.vue`
   - 网格布局，响应式
   - 分页（每页 24/48 个）
3. **平台列表页** — `pages/[platform]-games.vue`（如 `/nes-games`）
   - 按 platform 过滤的游戏列表

### Phase 3 — 首页改造（Estd: 0.5 天）
**目标**：新用户进来有地方去。

**页面** — `pages/index.vue`：
- Hero 区域：大号欢迎块 + Play Random / Browse All CTA
- Featured 精选游戏（横向滚动，硬编码推荐列表）
- Emulators 按平台浏览区块

### Phase 4 — FAB + 队列 + 历史（Estd: 1-2 天）
**目标**：PRD 中定义的交互层，纯 localStorage。

**组件**：
1. **FAB** — `components/game/GameFAB.vue`
   - 3 态切换：无游戏（🎮 粉色）/ 运行中（⏸ 绿色）/ 已暂停（▶ 黄色）
   - 封面面板（5 格布局）
2. **队列系统** — composable `useGameQueue.ts`
   - add/remove/consume/rotate
3. **游戏历史** — composable `useGameHistory.ts`
   - recordPlay/getRecent/getContinueData
4. **进度保存** — composable `useGameSaves.ts`
   - save/load/delete

### Phase 5 — SEO + 发布（Estd: 0.5 天）
**目标**：可以上线见人。

- 配置 nuxt.config.ts site URL、site name
- 游戏详情页补 VideoGame Schema.org
- Cloudflare Pages 部署
- 手工录入 5-10 个游戏验证 SOP

---

## 三、数据流

```
retrovault-scraper/data/
├── games/*.json           → 拷贝到 public/data/games/
├── covers/*.webp          → 拷贝到 public/data/covers/
├── roms/{platform}/*      → 拷贝到 public/roms/{platform}/
├── ejs_config.json        → 用于验证核心映射
└── rom_map.json           → 追踪 ROM 下载状态

Nuxt 访问方式：
  $fetch(`/data/games/${slug}.json`)  → 游戏元数据
  <img src="/data/covers/...">        → 封面
  EmulatorJS 加载 ROM/roms/...        → ROM 文件
```

---

## 四、目录结构变化（Phase 1 完成后）

```
pages/
├── index.vue               # 首页（改造）
├── games/
│   ├── index.vue            # 游戏列表（Phase 2）
│   └── [slug].vue           # 游戏详情页（Phase 1）
├── [platform]-games.vue     # 平台列表（Phase 2）

components/
├── game/
│   ├── GameCard.vue         # 游戏卡片（Phase 2）
│   ├── GameEmulator.vue     # EmulatorJS 封装（Phase 1）
│   └── GameFAB.vue          # 浮动按钮（Phase 4）

types/
└── game.ts                  # 游戏类型定义（Phase 1）

public/data/
├── games/                   # 游戏 JSON（Phase 0）
├── covers/                  # 封面图（Phase 0）
└── roms/                    # ROM 文件（Phase 0）
```

---

## 五、设计决策记录

| 决策 | 选择 | 原因 |
|------|------|------|
| 数据源 | public/data/ 静态 JSON | MVP 最快，零配置 |
| EmulatorJS | CDN 加载 | 验证阶段最简，上线前换自托管 |
| 用户数据 | localStorage | 原型期，未来迁 D1 |
| 模拟器核心 | EJS CDN + game.ejs.core | 爬虫已映射 1061 款 |
| CSS 方案 | Tailwind v4（现有） | 复用已有设计系统 |
