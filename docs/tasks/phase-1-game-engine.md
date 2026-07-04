# Phase 1：游戏加载与运行（核心 MVP）

> 状态：⬜ 待开始  
> 目标：可打开任意游戏详情页 → 点击 Play → EmulatorJS 全屏运行  
> 依赖：Phase 0（已完成）

---

## 任务清单

### 1.1 游戏类型定义
- [ ] 新建 `types/game.ts`
- [ ] 定义 `GameData`、`EJSConfig`、`LocalRom`、`Controls` 等接口
- [ ] 与爬虫 JSON 结构一一对应（字段见 Phase 0 文档）

参考字段：
```typescript
interface GameData {
  id: string
  slug: string
  title: string
  platform: string
  year: number
  genre: string
  developer: string
  publisher: string
  series: string
  tags: string[]
  imageUrl: string
  localCover: string
  defaultRom: string
  ejs: EJSConfig
  description: string
  longDescription: string[]
  controls: Record<string, string>
}
```

### 1.2 游戏详情页
- [ ] 新建 `pages/games/[slug].vue`
- [ ] 从 `/api/games/:slug` 加载数据
- [ ] Skeleton 加载态（数据未返回时）
- [ ] 404 态（游戏不存在）
- [ ] 渲染内容（匹配 demo `#page-detail` 结构）：
  - 返回按钮（`← Back to games`）
  - 大封面图标（120-170px，emoji 兜底）
  - 游戏名（Pixel 字体）
  - 元数据：类型、年份、标签
  - 描述文本（左边框粉色强调）
  - **Play Now 按钮**（绿色 pixel 风格）
  - **Queue 按钮**（黄色 pixel 风格）
  - 评论区（localStorage 实现）
- [ ] Play Now → 触发 EmulatorJS 全屏

### 1.3 EmulatorJS 组件
- [ ] 新建 `components/game/GameEmulator.vue`
- [ ] CDN 加载（`https://cdn.emulatorjs.org/stable/data/loader.js`）
- [ ] 根据 `game.ejs.core` 选择核心（`nes`/`snes`/`gba`/`arcade` 等）
- [ ] ROM URL = `/roms/` + `game.defaultRom`
- [ ] 全屏模式（fixed 定位，z-index 覆盖所有内容）
- [ ] 匹配 demo 全屏 UI（顶栏：游戏名 + 暂停/继续 + 关闭）
- [ ] 键盘快捷键：F 全屏、Esc 关闭

### 1.4 游戏卡片组件（基础版）
- [ ] 新建 `components/game/GameCard.vue`
- [ ] 匹配 demo `.game-card-mini` 样式
- [ ] props：`game: GameData`
- [ ] 封面图标（实封面或 emoji 兜底）
- [ ] ▶ Play 按钮（绿色圆形，右上角）
- [ ] 游戏名 + 年份
- [ ] 标签展示

### 1.5 浮动游戏窗口（基础版）
- [ ] 新建 `components/game/GameFloatWindow.vue`
- [ ] 匹配 demo `.game-float-window` 样式
- [ ] 最小化/最大化/关闭
- [ ] 显示当前游戏名 + 状态
- [ ] 拖拽移动（mousedown/mousemove 手势）

### 1.6 状态管理（Composable）
- [ ] 新建 `composables/useGameEngine.ts`
  - `currentGameId`（响应式 ref）
  - `gameRunning` / `gamePaused`（响应式 ref）
  - `score`（响应式 ref）
  - `loadGame(id)` — 加载指定游戏
  - `pauseGame()` / `resumeGame()` / `closeGame()`

---

## 验收标准

```
打开 /games/007-everything-or-nothing-gba
→ 看到游戏名、封面、描述
→ 点 Play Now
→ EmulatorJS 全屏加载 ROM
→ 游戏可玩
→ 键盘操作、暂停、关闭正常
→ 返回列表再进其他游戏，同样流程
```
