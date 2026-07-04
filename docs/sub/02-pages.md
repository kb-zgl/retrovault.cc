# 02 — 页面设计

> 参考：classicgamezone.com 像素级还原  
> 框架：Nuxt.js 4 + Tailwind CSS

---

## 全局组件

### 顶部导航 `AppHeader`

```
[Logo: RetroVault]  [Games] [Game Series] [Genres ▼] [Explore ▼] [Blog]  [语言切换] [用户头像(预留)]
```

- Logo 点击回首页
- Genres 下拉：按类型列表
- Explore 下拉：开发商 / 年份列表 / 主机 / 所有平台
- 语言切换：EN / 中文
- 移动端：汉堡菜单

### 左侧边栏 `AppSidebar`（桌面端固定，移动端收起）

```
[≡ 折叠按钮]

🕹️ Game Emulators
  Arcade (424)
  SNES (318)
  NES (286)
  ...（全部平台）

🎮 Game Genres
  Platformer (270)
  RPG (215)
  ...

🎯 Game Series
  Pokémon (88)
  Sonic (39)
  ...

🏷️ Game Tags
  8-bit (200)
  side-scrolling (87)
  ...
```

### 底部 `AppFooter`

```
[RetroVault]                [快速链接]              [语言列表]
直接在浏览器中体验           首页 / 关于             English / 简体中文
经典复古游戏                 隐私政策 / 服务条款

© 2025 RetroVault.cc
```

---

## 页面详细设计

---

### P01 — 首页 `/`

**URL**: `/` 和 `/zh-cn/`

**布局结构**：

```
[Hero区]
  标题：重温经典：免费线上玩复古游戏
  副标题：直接在浏览器中体验游戏黄金时代的传奇游戏
  [探索复古游戏] [了解更多] 按钮

[热门平台卡片区]  ← 6-8个平台卡片，图标+名称+数量
  Arcade (424)  NES (286)  SNES (318)  GBA (253)  N64 (175)  PS (264)

[精选游戏区]  ← 12张游戏卡片，3x4网格
  标题：精选游戏

[热门系列区]  ← 系列卡片列表
  Pokémon / Sonic / Super Mario / Mega Man ...

[热门类型区]
  Platformer / RPG / Fighting / Racing ...

[最近更新区]  ← 最新入库的游戏
```

**SEO**：
- `<title>`: `RetroVault - Play Free Retro Games Online | NES, SNES, GBA, Arcade`
- `<meta description>`: 免费在线玩经典怀旧游戏...

---

### P02 — 游戏列表页 `/games`

**URL**: `/games?page=1&platform=&genre=&sort=`

**布局**：

```
[面包屑] Home > Games

[筛选栏]
  平台 ▼  |  类型 ▼  |  系列 ▼  |  年份 ▼  |  原版/改版 ▼  |  排序 ▼
  [搜索框: 按标题/平台/类型搜索]
  显示 X / 共 Y 款游戏

[游戏网格]  ← 24张卡片/页
  每张卡片：封面 + 平台标签 + 标题 + 年份 + 类型 + 系列

[分页]  ← 上一页 / 页码 / 下一页
```

**游戏卡片 `GameCard` 组件**：

```
┌────────────────────┐
│   封面图（1:1）     │
│  [平台标签: GBA]   │
│  [Hack标签]        │
└────────────────────┘
  标题（2行截断）
  2003   RPG
  系列: Pokémon
  [简介2行截断]（桌面端显示）
```

---

### P03 — 游戏详情页 `/games/[slug]` ⭐ 核心页

**URL**: `/games/super-mario-bros-lost-levels`

**布局（未游玩状态）**：

```
[面包屑] Home > Games > NES > Super Mario Bros.: The Lost Levels

┌─────────────────────────────────────────────────────────┐
│  左1/3: 封面图区                                         │
│    封面图（模糊背景 + 清晰主图）                          │
│                                                         │
│  右2/3: 信息区                                           │
│    h1: 游戏标题  [Hack标签]                              │
│    [❤ 0 点赞]  [🔖 0 收藏]  ← 预留，初期不展示         │
│    [▶ 游玩]  [收藏]  [回报问题]                          │
│    简介文字                                              │
│    平台 | 年份 | 类型 | 开发商                           │
│    系列 | 语言                                           │
└─────────────────────────────────────────────────────────┘

[广告位 728x90]

[操作说明区]（折叠，默认收起）
  D-Pad: Move  |  A: Jump  |  B: Run  |  Start: Pause

[关于本游戏]
  段落1...
  段落2...

[评论区]（预留，初期显示空状态）

[相关游戏]  ← 6列网格
  同系列 / 同平台游戏
```

**布局（游玩状态）**：

```
[模拟器窗口 3/4宽]          [右侧栏 1/4宽]
  [← 返回]   [全屏]           游戏信息卡片
  ┌──────────────────┐        广告位
  │                  │        相关游戏（3个）
  │   EmulatorJS     │
  │   游戏画面       │
  │                  │
  └──────────────────┘
  [游玩状态消息提示]
```

**广告触发**：
- 点击「游玩」时触发 Popunder

**结构化数据**：
```json
{
  "@type": "VideoGame",
  "name": "...",
  "description": "...",
  "gameEmulator": "NES",
  "datePublished": "1986",
  "genre": ["Platformer"],
  "image": "...",
  "isAccessibleForFree": true
}
```

---

### P04 — 平台列表页 `/[platform]-games`

**URL 示例**: `/arcade-games` / `/nes-games` / `/gba-games`

**布局**：

```
[面包屑] Home > Arcade Games

[Hero区]
  图标 + 标题：Arcade Games
  副标题：Play XXX classic Arcade games online for free
  平台统计：XXX games available

[平台简介]（2-3段，来自 platforms.description）

[筛选栏]（简化版，只有类型/年份/排序）

[游戏网格 24/页]

[分页]
```

---

### P05 — 类型列表页 `/game-genres/[slug]-games`

**URL 示例**: `/game-genres/platformer-games`

**布局**：

```
[面包屑] Home > Game Genres > Platformer

[Hero区]
  标题：Platformer Games
  统计：XXX games | 年份范围 | 平台列表

[类型简介]

[游戏网格 24/页]

[分页]
```

---

### P06 — 系列列表页 `/game-series/[slug]-games`

**URL 示例**: `/game-series/super-mario-games`

**布局**：

```
[面包屑] Home > Game Series > Super Mario

[Hero区]
  标题：Super Mario Games
  统计：XX games | 平台 | 年份范围

[游戏网格]（按年份排序）
```

---

### P07 — 开发商页 `/game-developer/[slug]-games`

**URL 示例**: `/game-developer/nintendo-games`

**布局**：同系列页，展示该开发商所有游戏。

---

### P08 — 年份页 `/yearly-games/[year]-games`

**URL 示例**: `/yearly-games/1996-games`

**布局**：
```
[Hero区]
  标题：1996 Games
  说明：Explore and play classic retro games from 1996

[游戏网格]
```

---

### P09 — 标签页 `/game-tags/[slug]`

**URL 示例**: `/game-tags/8-bit`

**布局**：同类型页。

---

### P10 — 主机百科页 `/game-consoles/[platform]`

**URL 示例**: `/game-consoles/NES`

**布局**：

```
[面包屑] Home > Explore > NES

[主机信息卡]
  名称 | 制造商 | 发售年份 | 销量 | 代表作

[技术规格]
  处理器 / 分辨率 / 音频 / 存储

[历史介绍]（长文，多段）

[代表游戏]（6-12张卡片）
```

---

### P11 — 主机列表页 `/game-consoles`

**布局**：所有平台卡片网格。

---

### P12 — 系列列表页 `/game-series`

**布局**：所有系列卡片网格。

---

### P13 — 博客列表 `/blogs`

**布局**：

```
[Hero区] 标题 + 搜索框 + 标签筛选

[精选文章]（大图展示）

[文章卡片列表]（封面 + 标题 + 摘要 + 日期 + 标签）

[分页]
```

---

### P14 — 博客详情 `/blogs/[slug]`

**布局**：标准博客文章页，左侧正文，右侧目录+相关文章。

---

### P15 — 关于 `/about`

静态页，介绍平台理念、使用方法。

---

### P16 — 隐私政策 `/privacy`、服务条款 `/terms`

静态页。

---

## 核心组件清单

| 组件 | 路径 | 说明 |
|------|------|------|
| `GameCard` | `components/GameCard.vue` | 游戏卡片，列表页复用 |
| `GameEmulator` | `components/GameEmulator.vue` | EmulatorJS封装 |
| `GameControls` | `components/GameControls.vue` | 操作说明展示 |
| `GameRelated` | `components/GameRelated.vue` | 相关游戏列表 |
| `AppHeader` | `components/AppHeader.vue` | 顶部导航 |
| `AppSidebar` | `components/AppSidebar.vue` | 左侧边栏 |
| `AppFooter` | `components/AppFooter.vue` | 底部 |
| `Breadcrumb` | `components/Breadcrumb.vue` | 面包屑 |
| `Pagination` | `components/Pagination.vue` | 分页 |
| `GameFilters` | `components/GameFilters.vue` | 筛选栏 |
| `AdSlot` | `components/AdSlot.vue` | 广告位容器 |
| `RomVersionSelector` | `components/RomVersionSelector.vue` | ROM版本选择弹窗 |
| `DiscSelector` | `components/DiscSelector.vue` | 多碟游戏选碟弹窗 |
| `LanguageSwitcher` | `components/LanguageSwitcher.vue` | 语言切换 |
