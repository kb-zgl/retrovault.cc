# Phase 3：首页搭建

> 状态：⬜ 待开始  
> 目标：首页 Hero + 各栏目，匹配 demo `#page-home`  
> 依赖：Phase 1（GameCard 组件）

---

## 任务清单

### 3.1 Hero 入口区块
- [ ] 匹配 demo `.hero-enter` 结构
- [ ] 图标（🕹️）+ 标题「Explore All Games」
- [ ] 副标题 + 游戏总数 badge
- [ ] 点击 → 跳转到游戏列表页
- [ ] hover 边框变粉色，active scale 动画

### 3.2 栏目区块
- [ ] **Recent** — 最近添加游戏（横向滚动 `.scroll-row`）
- [ ] **Featured** — 精选游戏（横向滚动）
- [ ] **Emulators** — 按平台浏览（图标 + 游戏数）
- [ ] **Developers** — 按开发商浏览
- [ ] 每个栏目都有「View all →」查看更多按钮

### 3.3 导航栏
- [ ] 匹配 demo `.pixel-nav`
- [ ] 标签：Home / Games / Tags / News / Guestbook / About
- [ ] active 态粉底白字
- [ ] 页面切换（SPA 路由）

### 3.4 改造现有 index.vue
- [ ] 替换 starter 模板内容
- [ ] 保留 layout（Header/Sidebar/Footer/MobileTabBar）
- [ ] SEO Meta 更新

---

## 验收标准

```
访问 /
→ 看到 Hero 区块 + 4 个栏目
→ 横向滚动手感流畅
→ 点游戏卡片 → 跳转到详情页
→ 点导航 → 切换页面
```
