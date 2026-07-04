# Phase 4：交互层（FAB + 队列 + 历史 + 浮窗）

> 状态：⬜ 待开始  
> 目标：沉浸式游戏体验，匹配 demo 完整交互  
> 依赖：Phase 1（GameCard、GameFloatWindow）

---

## 任务清单

### 4.1 FAB 组件（Phase 1 已建基础，现完善）
- [ ] 完善 `components/game/GameFAB.vue`
- [ ] 匹配 demo `.fab-btn` 三态：
  - `idle`（粉色 🎮）— 无游戏运行
  - `playing`（绿色 ⏸ + 分数 badge）
  - `paused-state`（黄色 ▶）
- [ ] FAB 菜单（`.fab-menu`）：Random Game / Queue / Resume Last
- [ ] 点击 FAB（无游戏时）→ 展开菜单
- [ ] 点击 FAB（有游戏时）→ 暂停/继续
- [ ] backdrop 遮罩

### 4.2 队列系统
- [ ] 新建 `composables/useGameQueue.ts`
- [ ] `queue: Ref<string[]>`（游戏 slug 数组）
- [ ] `addToQueue(slug)` / `removeFromQueue(slug)` / `toggleQueue(slug)`
- [ ] `consumeQueue()` — 取出第一个并轮转
- [ ] 持久化：localStorage `playQueue` key
- [ ] 卡片 + 详情页 Queue 按钮联动

### 4.3 游戏历史
- [ ] 新建 `composables/useGameHistory.ts`
- [ ] `history: Ref<GameHistoryEntry[]>`（max 50 条）
- [ ] `recordPlay(slug, duration, score)` — 记录一局
- [ ] `getRecent(limit: number)` — 最近 N 个游戏
- [ ] `getContinueData()` — 返回上次游玩的游戏
- [ ] 持久化：localStorage `userGameHistory` key

### 4.4 游戏进度保存
- [ ] 新建 `composables/useGameSaves.ts`
- [ ] `saveGame(slug, state)` — 保存存档
- [ ] `loadGame(slug)` — 读取存档
- [ ] 触发时机：切换游戏、暂停、游戏结束、关闭窗口

### 4.5 浮动窗口完善
- [ ] 完善 `GameFloatWindow.vue`
- [ ] 匹配 demo `.game-float-window` 完整样式
- [ ] Canvas 游戏引擎（demo 中的 Snake 贪吃蛇）
- [ ] 顶栏显示游戏名 + 分数
- [ ] 状态指示器（Running/Paused/Game Over 圆点）
- [ ] 拖拽移动
- [ ] 最小化/最大化/关闭

---

## 验收标准

```
打开游戏 → 看到 FAB 变绿色 + 分数
点 FAB → 暂停游戏
再点 FAB → 继续游戏
点卡片 Queue 按钮 → 加入队列
FAB 菜单 → Queue → 消费队列游戏
关闭游戏 → 重新打开 → 进度保留
```
