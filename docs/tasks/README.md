# RetroVault · 任务总览

> 版本：1.0  
> 更新：2026-07-04  
> 项目文档：[PRD](../../docs/sub/PRD.md) · [Style Guide](../../docs/pixel-arcade-ui-style-guide.md) · [Demo](../../docs/pixel-arcade-v3.html)

---

## 阶段总览

| Phase | 内容 | 状态 | 文档 |
|-------|------|------|------|
| Phase 0 | 数据接入 + API 层 | ✅ 完成 | [phase-0-data-access.md](phase-0-data-access.md) |
| Phase 1 | 游戏加载与运行（EmulatorJS + 详情页） | ⬜ 待开始 | [phase-1-game-engine.md](phase-1-game-engine.md) |
| Phase 2 | 游戏列表与浏览（列表页 + 筛选 + 分类） | ⬜ 待开始 | [phase-2-game-lists.md](phase-2-game-lists.md) |
| Phase 3 | 首页搭建（Hero 区块 + 各栏目） | ⬜ 待开始 | [phase-3-homepage.md](phase-3-homepage.md) |
| Phase 4 | 交互层（FAB + 队列 + 历史 + 浮窗） | ⬜ 待开始 | [phase-4-fab-queue.md](phase-4-fab-queue.md) |
| Phase 5 | SEO 优化 + Cloudflare 发布 | ⬜ 待开始 | [phase-5-seo-deploy.md](phase-5-seo-deploy.md) |

---

## 当前项目状态

### 已就绪
- ✅ Nuxt 4 + Tailwind CSS v4 开发环境
- ✅ 设计系统匹配 pixel-arcade-v3.html（Pink 色板 + 深紫黑背景）
- ✅ 全部样式组件（导航/卡片/FAB/浮窗/筛选/留言板/登录等）
- ✅ 爬虫数据 2324 个游戏 JSON
- ✅ API 路由 `GET /api/games` 和 `GET /api/games/:slug`
- ✅ ROMs + 封面图 symlink 到 public/
- ✅ .gitignore

### 待构建
- ⬜ 游戏详情页 `/games/[slug]`
- ⬜ EmulatorJS 全屏模拟器组件
- ⬜ 游戏卡片组件
- ⬜ 游戏列表页 + 分类页 + 筛选
- ⬜ 首页 Hero + 各栏目
- ⬜ FAB + 队列 + 游戏历史
- ⬜ 浮动游戏窗口
- ⬜ 游戏进度保存
- ⬜ SEO 结构化数据
- ⬜ Cloudflare 部署

---

## 命名规范（后续代码一致）

```
页面路由:      /games, /games/[slug], /[platform]-games
组件:         components/game/GameEmulator.vue, GameCard.vue, GameFAB.vue
Composable:   composables/useGameQueue.ts, useGameHistory.ts, useGameSaves.ts
类型定义:      types/game.ts
API:          GET /api/games, GET /api/games/:slug
```
