# RetroVault · 任务总览

> 版本：2.0  
> 更新：2026-07-04  
> 项目文档：[PRD](../../docs/sub/PRD.md) · [Style Guide](../../docs/pixel-arcade-ui-style-guide.md) · [Demo](../../docs/pixel-arcade-v3.html)

---

## 阶段总览

| Phase | 内容 | 状态 | 文档 |
|-------|------|------|------|
| Phase 0 | 数据接入 + API 层 | ✅ 完成 | [phase-0-data-access.md](phase-0-data-access.md) |
| Phase 1 | 游戏加载与运行（EmulatorJS + 详情页） | ✅ 完成 | [phase-1-game-engine.md](phase-1-game-engine.md) |
| Phase 2 | 游戏列表与浏览（列表页 + 筛选 + 分类） | ✅ 完成 | [phase-2-game-lists.md](phase-2-game-lists.md) |
| Phase 3 | 首页搭建（Hero 区块 + 各栏目） | ✅ 完成 | [phase-3-homepage.md](phase-3-homepage.md) |
| Phase 4 | 交互层（FAB + 队列 + 历史 + 浮窗） | ✅ 完成 | [phase-4-fab-queue.md](phase-4-fab-queue.md) |
| Phase 5 | SEO 优化 + Cloudflare 发布 | ✅ 完成 | [phase-5-seo-deploy.md](phase-5-seo-deploy.md) |

---

## 当前成果

### 已完成的页面

| 页面 | URL | 说明 |
|------|-----|------|
| 首页 | `/` | Hero + Recent/Featured/Emulators 栏目 |
| 游戏列表 | `/games` | 网格布局 + 筛选（类型/平台）+ 分页 |
| 游戏详情 | `/games/:slug` | 封面、描述、Play Now（EmulatorJS 全屏）、评论、Queue |
| 平台页 | `/:platform-games` | 如 `/nes-games`、`/arcade-games` |

### 核心组件

| 组件 | 用途 |
|------|------|
| `GameEmulator.vue` | EmulatorJS CDN 全屏加载 |
| `GameCard.vue` | 游戏卡片（封面、Play 按钮、tag） |
| `GameFAB.vue` | 浮动按钮（3 态：idle/playing/paused）+ 菜单 |
| `GameFloatWindow.vue` | 浮动游戏窗口（拖拽、最小化、状态指示）|

### Composables

| Composable | 用途 |
|------|------|
| `useGameEngine.ts` | 游戏状态（currentGame、running/paused、emulator/float）|
| `useGameQueue.ts` | 队列（add/remove/toggle/consume）|
| `useGameHistory.ts` | 游戏历史 + 会话存档 |
| `useGameSaves.ts` | 进度快照 |

### SEO

- 每页独享 `useSeoMeta`（title/description/og）
- 游戏详情页 `VideoGame` Schema.org（结构化数据）
- 首页 `WebSite` Schema
- `@nuxtjs/seo` 自动 sitemap + robots

---

## 🎉 全部完成

所有 Phase 0–5 功能已上线，原待完善项（留言板/News/关于/登录/日间模式/R2/多语言/D1）均已实现。Snake 小游戏不纳入计划。
