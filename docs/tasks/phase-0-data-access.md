# Phase 0：数据接入 + API 层

> 状态：✅ 已完成  
> 目标：爬虫数据可被 Nuxt 读取

---

## 完成项

- [x] **`server/utils/games.ts`** — 通用工具，读取爬虫 `game_list.json`，提供 `loadGameList()` 函数
- [x] **`server/api/games/index.get.ts`** — `GET /api/games`
  - 返回分页游戏列表
  - 支持 query 参数：`platform`、`genre`、`page`、`limit`
  - 返回 `platforms` 和 `genres` 枚举（供前端筛选使用）
- [x] **`server/api/games/[slug].get.ts`** — `GET /api/games/:slug`
  - 返回单游戏完整数据（含 ejs 配置、描述、控制等）
  - 不存在时返回 404
- [x] **`public/roms/` symlink** — 指向 `retrovault-scraper/data/roms/`（23 个平台）
- [x] **`public/covers/` symlink** — 指向 `retrovault-scraper/data/covers/`（2251 张封面）
- [x] **`.gitignore`** — 忽略 ROM 文件 + 封面图，追踪元数据 JSON

---

## 数据结构

### 列表响应（`/api/games`）
```json
{
  "total": 892,
  "totalAll": 2326,
  "page": 1,
  "limit": 48,
  "hasMore": true,
  "platforms": ["Arcade", "GBA", "NES", ...],
  "genres": ["Action", "Platformer", "RPG", ...],
  "games": [
    { "slug": "1942", "title": "1942", "platform": "Arcade", "year": 1984, "genre": "Shooter", ... },
    ...
  ]
}
```

### 详情响应（`/api/games/:slug`）
```json
{
  "id": "007-everything-or-nothing-gba",
  "title": "007: Everything or Nothing",
  "platform": "Game Boy Advance",
  "ejs": { "core": "gba", "biosUrl": "" },
  "defaultRom": "roms/game-boy-advance/007-everything-or-nothing-gba.gba",
  "localRoms": [{ "lang": "default", "relPath": "roms/...", "url": "..." }],
  ...
}
```
