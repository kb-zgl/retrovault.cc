# Phase 5：SEO 优化 + Cloudflare 发布

> 状态：⬜ 待开始  
> 目标：可上线，Google 可收录  
> 依赖：Phase 1-4（所有页面就绪）

---

## 任务清单

### 5.1 SEO 基础配置
- [ ] 更新 `nuxt.config.ts` — `site.url`、`site.name`
- [ ] 更新 `composables/usePageSeo.ts` — SITE_NAME、TAGLINE
- [ ] sitemap 自动生成（@nuxtjs/seo 已配置）
- [ ] robots.txt（已允许 `/`）
- [ ] 每个页面动态 title/meta/description

### 5.2 结构化数据
- [ ] 游戏详情页添加 `VideoGame` Schema.org（JSON-LD）
- [ ] 关键词：`play [游戏名] online free`、`[游戏名] online no download`

### 5.3 OG 图片
- [ ] 更新 `components/og/AppOgImage.vue`（已 Pink 色）
- [ ] 确保游戏详情页 OG 图包含游戏名

### 5.4 Cloudflare 部署
- [ ] 更新 `wrangler.toml` — project name、compatibility date
- [ ] `pnpm build` + `wrangler deploy` 测试
- [ ] 验证 API routes 在 Cloudflare 上可用（serverless）
- [ ] 验证 ROMs 路径在部署后可用（静态文件）

### 5.5 手工录入 SOP
- [ ] 文档化：加游戏流程
  1. 下载 ROM 文件放入 `retrovault-scraper/data/roms/{platform}/`
  2. 运行爬虫脚本更新元数据
  3. 验证 API 返回新游戏
  4. 验证 EmulatorJS 加载

---

## 验收标准

```
pnpm build && wrangler deploy
→ 站点可访问
→ /games 列表正常
→ /games/:slug 详情 + EmulatorJS 正常
→ /sitemap.xml 有内容
→ LightHouse SEO 90+
```
