# Phase 2：游戏列表与浏览

> 状态：⬜ 待开始  
> 目标：可浏览全部游戏，按平台/类型筛选，按分类浏览  
> 依赖：Phase 1（GameCard 组件、API 层）

---

## 任务清单

### 2.1 游戏列表页
- [ ] 新建 `pages/games/index.vue`
- [ ] 网格布局（匹配 demo `.game-list-full`）
- [ ] 2/3/4 列响应式（375/600/1024px）
- [ ] 前端筛选栏（匹配 demo `.filter-bar`）：
  - Category 筛选按钮组
  - Tags 筛选按钮组
  - Clear filters 按钮
- [ ] 筛选结果信息条（`Showing all games` / `"Shooter" · 24 games`）
- [ ] 空结果状态（No games found）
- [ ] 分页加载（或「Load More」按钮）

### 2.2 平台列表页
- [ ] 创建 `pages/[platform]-games.vue`（如 `/nes-games`）
- [ ] 从 `/api/games?platform=nes` 加载
- [ ] 标题「NES Games Online Free」SEO 友好
- [ ] 平台专属统计（"286 games on NES"）

### 2.3 分类网格页
- [ ] 匹配 demo `.category-grid` / `.category-card`
- [ ] 2/3/4 列网格
- [ ] 分类名 + 游戏数
- [ ] 点击跳转到筛选后的游戏列表

### 2.4 标签云页
- [ ] 匹配 demo `.tag-cloud`
- [ ] 尺寸按游戏数分级（large/medium/small）
- [ ] 点击 → 筛选对应标签的游戏列表

---

## 验收标准

```
访问 /games
→ 看到 48 个游戏，网格排列
→ 点 Category "Shooter" → 只显示射击类
→ 点 Tags "Classic" → 进一步筛选
→ 点 Clear → 恢复全部
→ 访问 /nes-games → 显示 NES 平台全部 286 个游戏
```
