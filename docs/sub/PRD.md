# RetroVault — 产品需求文档 (PRD)

> 版本：v1.0  
> 状态：待开发  
> 技术栈：Nuxt.js 4 + Tailwind CSS + Cloudflare Module + Cloudflare R2 + Cloudflare D1  

---

## 目录

- [01. 产品概述](#01-产品概述)
- [02. 技术架构](#02-技术架构)
- [03. 子文档索引](#03-子文档索引)
- [04. 核心数据结构](#04-核心数据结构)
- [05. 页面路由总览](#05-页面路由总览)
- [06. 多语言策略](#06-多语言策略)
- [07. SEO策略](#07-seo策略)
- [08. 变现策略](#08-变现策略)
- [09. 里程碑计划](#09-里程碑计划)

---

## 01. 产品概述

### 定位
RetroVault 是一个经典复古游戏在线模拟器平台，用户无需下载任何软件，直接在浏览器中免费游玩 NES、SNES、GBA、街机等经典游戏。

### 竞品参考
对标 classicgamezone.com（像素级别还原其页面结构、SEO策略、用户交互）。

### 核心目标
- 游戏数量：2000+ 款（覆盖主流复古平台）
- 语言：英语（主力）+ 简体中文（同步上线）
- 变现：Adsterra / HilltopAds Popunder + Banner 广告
- 托管：Cloudflare Pages（零成本）
- ROM存储：Cloudflare R2

### 核心差异点
- 程序化SEO：每个游戏独立落地页，平台/类型/系列/开发商/年份/标签交叉索引
- 多维度内链网络：最大化 Google 收录页面数
- 初期不做用户系统，预留字段，后期可扩展

---

## 02. 技术架构

```
┌─────────────────────────────────────────────────────────┐
│                    Cloudflare Pages                      │
│                   (Nuxt.js 4 SSR)                   │
├──────────────┬──────────────┬──────────────┬────────────┤
│  Cloudflare  │  Cloudflare  │  Cloudflare  │ EmulatorJS │
│     R2       │     D1       │    KV        │   (本地部署)│
│  (ROM/封面)  │  (游戏数据)  │  (缓存/配置) │            │
└──────────────┴──────────────┴──────────────┴────────────┘
```

### 技术选型说明

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端框架 | Nuxt.js 4 | SSR渲染，SEO友好 |
| 样式 | Tailwind CSS | 工具类，快速还原竞品UI |
| 模拟器 | EmulatorJS（开源版，本地部署） | 不依赖第三方CDN，完全自控 |
| 数据库 | Cloudflare D1（SQLite） | 游戏元数据、用户数据预留 |
| 文件存储 | Cloudflare R2 | ROM文件、封面图 |
| 边缘缓存 | Cloudflare KV | 热门游戏数据缓存 |
| 部署 | Cloudflare Pages | 免费，全球CDN |
| 广告 | Adsterra + HilltopAds | 不用AdSense |

---

## 03. 子文档索引

| 文档 | 内容 | 路径 |
|------|------|------|
| 数据库设计 | 所有表结构及字段说明 | [docs/01-database.md](./docs/01-database.md) |
| 页面设计 | 每个页面的详细布局需求 | [docs/02-pages.md](./docs/02-pages.md) |
| EmulatorJS集成 | 模拟器接入方案 | [docs/03-emulatorjs.md](./docs/03-emulatorjs.md) |
| SEO规范 | URL结构、Meta、结构化数据 | [docs/04-seo.md](./docs/04-seo.md) |
| 多语言方案 | i18n实现、翻译策略 | [docs/05-i18n.md](./docs/05-i18n.md) |
| 广告集成 | 广告位布局、接入代码 | [docs/06-ads.md](./docs/06-ads.md) |
| ROM管理 | R2存储结构、访问策略 | [docs/07-rom-storage.md](./docs/07-rom-storage.md) |
| 数据导入 | 爬虫数据 → D1入库流程 | [docs/08-data-import.md](./docs/08-data-import.md) |

---

## 04. 核心数据结构

基于实际抓取的游戏数据（见下方示例），定义全站核心数据模型。

### 游戏数据示例
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

### 数据流向
```
scraper.mjs → all_games.json
     ↓
data-import.mjs → Cloudflare D1
     ↓
Nuxt pages → 读D1 → 渲染页面
```

详细表结构见 [docs/01-database.md](./docs/01-database.md)。

---

## 05. 页面路由总览

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

## 06. 多语言策略

- **初期上线语言**：英语（默认，无前缀）+ 简体中文（`/zh-cn/`）
- **URL结构**：子目录方式（`/zh-cn/games/slug`）
- **翻译内容**：UI文本、游戏标题、游戏描述、页面Meta
- **翻译来源**：AI翻译打底，后期人工润色
- **语言检测**：根据浏览器语言自动跳转，可手动切换

详细方案见 [docs/05-i18n.md](./docs/05-i18n.md)。

---

## 07. SEO策略

### 核心原则
每个维度（游戏/平台/类型/系列/开发商/年份/标签）都有独立URL，通过密集内链网络最大化收录。

### 关键词策略
- 游戏详情页：`play [游戏名] online free`、`[游戏名] online no download`
- 平台页：`[platform] games online free`
- 类型页：`[genre] retro games online`

### 结构化数据
游戏详情页使用 `VideoGame` Schema.org 标记。

详细SEO规范见 [docs/04-seo.md](./docs/04-seo.md)。

---

## 08. 变现策略

| 广告形式 | 位置 | 网络 | 说明 |
|----------|------|------|------|
| Popunder | 用户点击Play时触发 | PopAds / PropellerAds | 主力收入 |
| Banner 728x90 | 游戏窗口下方 | Adsterra | 桌面端 |
| Banner 320x50 | 移动端游戏下方 | Adsterra | 移动端 |
| 插页广告 | 游戏加载期间 | PropellerAds | 补充 |
| 原生广告 | 相关游戏列表中 | Adsterra Native | 低干扰 |

详细接入方案见 [docs/06-ads.md](./docs/06-ads.md)。

---

## 09. 里程碑计划

| 阶段 | 目标 | 时间 |
|------|------|------|
| Phase 1 | 数据库建表 + 数据导入 + 基础路由框架 | 第1-2周 |
| Phase 2 | 游戏详情页 + 模拟器集成 + 封面/ROM访问 | 第3-4周 |
| Phase 3 | 列表页（平台/类型/系列等所有维度） | 第5-6周 |
| Phase 4 | 首页 + 博客 + 多语言（中文） | 第7-8周 |
| Phase 5 | SEO优化 + 广告接入 + 性能调优 | 第9-10周 |
| Phase 6 | GSC提交 + 监控 + 上线 | 第11-12周 |
