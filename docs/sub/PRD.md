# RetroVault — 产品需求文档 (PRD)

> 版本：v2.0  
> 状态：开发中  
> 技术栈：Nuxt.js 4 + Tailwind CSS + Cloudflare Module + Cloudflare R2 + Cloudflare D1 + Cloudflare KV  
> 目标：2000+ 经典复古游戏在线模拟器平台，Mobile-First

---

## 目录

- [01. 产品概述](#01-产品概述)
- [02. 用户角色与核心流程](#02-用户角色与核心流程)
- [03. Feature Specifications](#03-feature-specifications)
- [04. 技术架构](#04-技术架构)
- [05. 数据结构与存储](#05-数据结构与存储)
- [06. 页面路由总览](#06-页面路由总览)
- [07. 多语言策略](#07-多语言策略)
- [08. SEO 策略](#08-seo-策略)
- [09. 变现策略](#09-变现策略)
- [10. 非功能性需求](#10-非功能性需求)
- [11. 里程碑计划](#11-里程碑计划)
- [12. 子文档索引](#12-子文档索引)

---

## 01. 产品概述

### 定位

RetroVault 是一个经典复古游戏在线模拟器平台。用户无需下载、无需注册，直接在浏览器中免费畅玩 NES、SNES、GBA、街机等 2000+ 款经典游戏。

### 核心价值主张

- **新用户**：3 次点击内发现并开始游戏
- **回访用户**：一键续玩，进度保留，无缝切换

### 竞品参考

对标 classicgamezone.com（像素级别还原其页面结构、SEO 策略、用户交互），同时在 UX 交互深度上超越竞品。

### 用户画像

| 角色 | 特征 | 需求 |
|------|------|------|
| **新访客** | 无历史记录，无队列 | 即时价值展示，快速试玩无需承诺 |
| **回访玩家** | 有游戏历史/队列 | 快速续玩，多游戏快速切换，进度持久化 |

### 核心目标

- **游戏数量**：2000+ 款（覆盖 NES、SNES、GBA、N64、Arcade、Genesis、PS 等主流复古平台）
- **语言**：英语（主力）+ 简体中文（同步上线）
- **变现**：Adsterra / HilltopAds / PropellerAds Popunder + Banner 广告
- **托管**：Cloudflare Pages（零成本全球 CDN）
- **ROM 存储**：Cloudflare R2
- **数据层**：Cloudflare D1（SQLite）

### 核心差异点

- **程序化 SEO**：每个游戏独立落地页，平台/类型/系列/开发商/年份/标签交叉索引，多维度内链网络最大化 Google 收录
- **沉浸式 UX**：FAB 快捷切换面板、智能队列、进度自动保存、双态 Hero（新用户 vs 回访用户）
- **纯前端原型可验证**：所有用户数据 localStorage 存储，未来无缝迁移至 D1 后端
- **初期无用户系统**：预留字段，后期可扩展

---

## 02. 用户角色与核心流程

### 2.1 发现 → 游玩

```
浏览首页/分类/列表 → 看到游戏卡片 → 点击 ▶ 按钮 → 全屏游戏启动
```

### 2.2 快速切换（FAB）

```
点击 FAB → 封面面板展开 → 点击游戏封面 → 当前游戏保存，新游戏加载
```

### 2.3 队列管理

```
在任意卡片点击 + → 加入队列 → FAB 面板显示队列游戏
从队列游玩 → 玩过后旋转至队尾
```

### 2.4 续玩

```
回到站点 → Hero 显示 "Continue" 上次游玩的游戏 → 点击恢复
或首页 "Continue Playing" 区块显示最近 6 个游戏
```

---

## 03. Feature Specifications

### 3.1 首页 (Home Page)

#### 3.1.1 Hero 区域 — 双态设计

| 状态 | 触发条件 | 布局 |
|------|----------|------|
| **新用户态** | `userGameHistory.length === 0` | 大号欢迎区块，3 个 CTA（Play Random / Popular / Browse All）+ Trending 标签 |
| **回访用户态** | `userGameHistory.length > 0` | 紧凑条，显示上次游玩的游戏 + Continue & Random 按钮 |

#### 3.1.2 首页区块顺序

1. **Continue Playing**（仅历史非空时显示）— 最近 6 个游戏，横向滚动
2. **Your Queue**（仅队列非空时显示）— 前 6 个队列游戏，横向滚动
3. **Featured** — 编辑精选
4. **Emulators** — 按平台浏览
5. **Developers** — 按开发商浏览

### 3.2 游戏卡片 (Game Cards)

每个游戏卡片（首页滚动、列表网格）包含：

- **封面图**（正方形，圆角，emoji 占位兜底）
- **▶ Play 按钮**（绿色，右上角）— 即时启动，跳过详情页
- **+ Queue 按钮**（黄色/绿色切换，Play 旁）— 添加/移除队列
- **游戏名 + 副标题**（年份或分类）
- 点击卡片主体 → 打开详情页

### 3.3 游戏详情页 (Game Detail Page)

- 大封面图（130-180px）
- 游戏名、分类、年份、标签
- 描述文本
- **Play Now** 按钮（全屏启动）
- **Add/Remove Queue** 按钮
- 评论区（原型期 localStorage 实现）

### 3.4 全屏游戏模式 (Fullscreen Game Mode)

- 触发方式：Play 按钮 / FAB 封面点击 / F 键
- Canvas 填满视口，半透明背景
- 顶栏：游戏名 + 分数 + 暂停/继续 + 全屏切换 + 关闭
- 键盘：方向键控制方向，空格暂停
- 模拟器引擎：**EmulatorJS**（开源版，本地部署，不依赖第三方 CDN）
- EJS 核心配置由游戏数据中的 `ejs.core` 字段指定（NES / SNES / GBA / Arcade 等）

### 3.5 FAB (Floating Action Button)

#### 3.5.1 FAB 状态

| 状态 | 图标 | 行为 |
|------|------|------|
| 无游戏运行 | 🎮（粉色） | 点击展开封面面板 |
| 游戏运行中 | ⏸（绿色）+ 分数徽标 | 点击暂停/继续 |
| 游戏已暂停 | ▶（黄色） | 点击继续 |

#### 3.5.2 FAB 封面面板

- 无游戏运行时点击 FAB 展开
- 显示 5 个游戏封面（正方形，圆角）一排：
  - 当前/运行中游戏（绿色边框 + 分数）
  - 最近历史（至多 4 个）
  - 队列填充（历史 < 4 时）
  - 随机填充（仍不足 5 时）
- 底栏：Random 按钮 / Queue（Next）按钮 / History 按钮
- 点击封面 → 保存当前进度 → 加载所选游戏
- 点击背景 → 关闭面板

### 3.6 队列系统 (Queue System)

- **添加**：任意卡片或详情页上的 + 按钮
- **移除**：再次点击（切换）
- **消费**：FAB "Queue" 按钮或首页 "Queue" 区域的 "Manage" → 取第一个，旋转至队尾
- **展示**：首页 "Your Queue" 区块、FAB 面板封面、卡片按钮状态
- **数据**：`playQueue` 数组（localStorage）→ 未来 D1 表

### 3.7 用户游戏历史 (User Game History)

每局游戏收集的数据：

```json
{
  "gameId": "super-mario-bros-lost-levels",
  "lastPlayedAt": 1720000000,
  "totalPlayTime": 320,
  "highScore": 42,
  "playCount": 5,
  "completed": false
}
```

用于：
- 首页 "Continue Playing" 区块
- FAB 面板封面推荐
- 未来：个性化推荐、用户档案

### 3.8 游戏进度保存 (Game Progress Saves)

**保存触发时机**：
- 切换游戏（FAB 封面点击、队列消费、卡片 Play）
- 暂停
- 游戏结束
- 关闭/最小化游戏窗口

**加载触发时机**：
- 开始之前玩过的游戏

**数据结构**：`gameSaves` 对象，keyed by gameId，存储模拟器状态快照（蛇类游戏存位置/分数，模拟器游戏存 EJS state）

### 3.9 评论系统

- 原型期：localStorage 实现，`gameComments_{gameId}` 数组
- 未来：D1 `comments` 表，支持用户登录后关联

---

## 04. 技术架构

```
┌─────────────────────────────────────────────────────────────┐
│                    Cloudflare Pages                          │
│                   (Nuxt.js 4 SSR)                     │
├──────────────┬──────────────┬──────────────┬────────────────┤
│  Cloudflare  │  Cloudflare  │  Cloudflare  │  EmulatorJS    │
│     R2       │     D1       │     KV       │  (本地部署)     │
│  (ROM/封面)  │  (游戏数据)  │  (缓存/配置) │                │
└──────────────┴──────────────┴──────────────┴────────────────┘
```

### 技术选型说明

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端框架 | Nuxt.js 4 | SSR 渲染，SEO 友好 |
| 样式 | Tailwind CSS v4 | 工具类，快速还原竞品 UI |
| 模拟器 | EmulatorJS（开源版，本地部署） | 不依赖第三方 CDN，完全自控 |
| 数据库 | Cloudflare D1（SQLite） | 游戏元数据、用户数据预留 |
| 文件存储 | Cloudflare R2 | ROM 文件、封面图 |
| 边缘缓存 | Cloudflare KV | 热门游戏数据缓存、session tokens、限流 |
| 部署 | Cloudflare Pages | 免费，全球 CDN |
| 广告 | Adsterra + HilltopAds + PropellerAds | 不用 AdSense |
| 前端存储 | localStorage | 原型期所有用户数据（历史、队列、存档、评论）|

### 数据流向

```
scraper.mjs → all_games.json
     ↓
data-import.mjs → Cloudflare D1
     ↓
Nuxt pages → 读 D1 → 渲染页面
     ↓
用户交互 → localStorage（原型期） → 未来：D1 用户表 + 定时同步
```

---

## 05. 数据结构与存储

### 5.1 游戏核心数据模型

基于实际抓取的游戏数据：

```json
{
  "id": "super-mario-bros-lost-levels",
  "slug": "super-mario-bros-lost-levels",
  "title": "Super Mario Bros.: The Lost Levels",
  "platform": "NES",
  "year": 1986,
  "genre": "Platformer",
  "developer": "Nintendo",
  "publisher": "Nintendo",
  "series": "Super Mario",
  "isHack": false,
  "tags": ["side-scrolling", "platforming precision", "8-bit", "boss fights"],
  "imageUrl": "...",
  "localCover": "covers/super-mario-bros-lost-levels.webp",
  "localRoms": [{ "lang": "default", "relPath": "roms/nes/..." }],
  "defaultRom": "roms/nes/super-mario-bros-lost-levels.nes",
  "ejs": { "core": "nes", "biosUrl": "" },
  "description": "...",
  "longDescription": ["...", "..."],
  "controls": { "D-Pad": "Move", "A": "Jump", "B": "Run" }
}
```

### 5.2 前端 LocalStorage Schema（原型期）

| Key | 类型 | 说明 | 上限 |
|-----|------|------|------|
| `userGameHistory` | Array | 游戏历史记录 | 50 条 |
| `gameSaves` | Object | 每局游戏存档，keyed by gameId | — |
| `playQueue` | Array | 游戏 ID 有序队列 | — |
| `currentGameId` | String | 上次活跃的游戏 ID | — |
| `pixelUser` | String | 登录用户名（预留） | — |
| `gameComments_{gameId}` | Array | 每局评论 | — |

### 5.3 后端迁移规划

| 数据类型 | 原型期 | 未来后端 |
|----------|--------|----------|
| 游戏历史 | localStorage → userGameHistory | D1 `user_history` 表 |
| 游戏存档 | localStorage → gameSaves | D1 `game_saves` 表 |
| 播放队列 | localStorage → playQueue | D1 `play_queue` 表 |
| 评论 | localStorage → gameComments_{id} | D1 `comments` 表 |
| 会话/限流 | — | KV session tokens / rate limiting |
| 游戏元数据 | D1 | D1（始终由服务端提供） |
| 同步流程 | 纯本地 | 登录 → 拉取远程 → 合并本地 → 定时后台同步 |

详细表结构见 [docs/01-database.md](./docs/01-database.md)。

---

## 06. 页面路由总览

```
/                               首页
/games                          游戏列表（全部）
/games/[slug]                   游戏详情页（核心页）

/[platform]-games               平台列表页
  /arcade-games
  /nes-games
  /snes-games
  /gba-games
  /n64-games
  /ps-games
  /genesis-games
  ...

/game-genres/[slug]-games       类型列表页
/game-series/[slug]-games       系列列表页
/game-developer/[slug]-games    开发商列表页
/yearly-games/[year]-games      年份列表页
/game-tags/[slug]               标签列表页
/game-consoles/[platform]       主机百科页

/blogs                          博客列表
/blogs/[slug]                   博客详情

/about                          关于
/privacy                        隐私政策
/terms                          服务条款
```

多语言前缀：

```
/zh-cn/games/[slug]             简体中文详情页
/zh-cn/arcade-games             简体中文平台页
...（其余同英文，加 /zh-cn/ 前缀）
```

详细页面设计见 [docs/02-pages.md](./docs/02-pages.md)。

---

## 07. 多语言策略

- **初期上线语言**：英语（默认，无前缀）+ 简体中文（`/zh-cn/`）
- **URL 结构**：子目录方式（`/zh-cn/games/slug`）
- **翻译内容**：UI 文本、游戏标题、游戏描述、页面 Meta
- **翻译来源**：AI 翻译打底，后期人工润色
- **语言检测**：根据浏览器语言自动跳转，可手动切换
- **数据结构**：D1 `games` 表通过 `title_en` / `title_zh` / `desc_en` / `desc_zh` 等列支持多语言

详细方案见 [docs/05-i18n.md](./docs/05-i18n.md)。

---

## 08. SEO 策略

### 核心原则

每个维度（游戏/平台/类型/系列/开发商/年份/标签）都有独立 URL，通过密集内链网络最大化收录。

### 关键词策略

- 游戏详情页：`play [游戏名] online free`、`[游戏名] online no download`
- 平台页：`[platform] games online free`
- 类型页：`[genre] retro games online`

### 结构化数据

游戏详情页使用 `VideoGame` Schema.org 标记。

详细 SEO 规范见 [docs/04-seo.md](./docs/04-seo.md)。

---

## 09. 变现策略

| 广告形式 | 位置 | 网络 | 说明 |
|----------|------|------|------|
| Popunder | 用户点击 Play 时触发 | PopAds / PropellerAds | 主力收入 |
| Banner 728x90 | 游戏窗口下方 | Adsterra | 桌面端 |
| Banner 320x50 | 移动端游戏下方 | Adsterra | 移动端 |
| 插页广告 | 游戏加载期间 | PropellerAds | 补充 |
| 原生广告 | 相关游戏列表中 | Adsterra Native | 低干扰 |

详细接入方案见 [docs/06-ads.md](./docs/06-ads.md)。

---

## 10. 非功能性需求

- **Mobile-First**：所有交互为触屏设计，最小宽度 375px
- **初始加载**：< 2s
- **游戏启动**：< 500ms
- **离线容忍**：localStorage 承载所有用户数据，在线时同步
- **可访问性**：最小触控目标 44px，可读字号（移动端 ≥12px）
- **原型期**：Snake 作为占位游戏，验证全流程；正式上线切换为 EmulatorJS 模拟真实 ROM

---

## 11. 里程碑计划

| 阶段 | 目标 | 时间 |
|------|------|------|
| Phase 1 | 数据库建表 + 数据导入 + 基础路由框架 | 第 1-2 周 |
| Phase 2 | 游戏详情页 + 模拟器集成 + 封面/ROM 访问 + 游戏卡片组件 | 第 3-4 周 |
| Phase 3 | 列表页（平台/类型/系列等所有维度） + FAB 组件 + 队列系统 | 第 5-6 周 |
| Phase 4 | 首页（双态 Hero）+ 博客 + 多语言（中文） + localStorage 用户数据层 | 第 7-8 周 |
| Phase 5 | SEO 优化 + 广告接入 + 性能调优 + 全屏游戏体验完善 | 第 9-10 周 |
| Phase 6 | GSC 提交 + 监控 + 上线 | 第 11-12 周 |

---

## 12. 子文档索引

| 文档 | 内容 | 路径 |
|------|------|------|
| 数据库设计 | 所有表结构及字段说明 | [docs/01-database.md](../01-database.md) |
| 页面设计 | 每个页面的详细布局需求 | [docs/02-pages.md](../02-pages.md) |
| EmulatorJS 集成 | 模拟器接入方案 | [docs/03-emulatorjs.md](../03-emulatorjs.md) |
| SEO 规范 | URL 结构、Meta、结构化数据 | [docs/04-seo.md](../04-seo.md) |
| 多语言方案 | i18n 实现、翻译策略 | [docs/05-i18n.md](../05-i18n.md) |
| 广告集成 | 广告位布局、接入代码 | [docs/06-ads.md](../06-ads.md) |
| ROM 管理 | R2 存储结构、访问策略 | [docs/07-rom-storage.md](../07-rom-storage.md) |
| 数据导入 | 爬虫数据 → D1 入库流程 | [docs/08-data-import.md](../08-data-import.md) |
