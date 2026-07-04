# 04 — SEO 规范

---

## URL 结构规范

### 英文（默认，无前缀）

```
/                                    首页
/games                               游戏列表
/games/[slug]                        游戏详情

/arcade-games                        平台页（固定格式）
/nes-games
/snes-games
/gba-games
/n64-games
/ps-games
/genesis-games
/game-boy-games
/nds-games
/sms-games
/pce-games
/game-gear-games
/jaguar-games
/ws-games
/sega-cd-games
/sega-32x-games
/ngp-games
/vb-games
/ss-games
/fds-games
/msx2-games
/coleco-vision-games
/c64-games

/game-genres/[genre-slug]-games      类型页
/game-series/[series-slug]-games     系列页
/game-developer/[dev-slug]-games     开发商页
/yearly-games/[year]-games           年份页
/game-tags/[tag-slug]                标签页
/game-consoles/[platform-id]         主机百科页
/game-consoles                       主机列表

/blogs                               博客列表
/blogs/[slug]                        博客详情

/about
/privacy
/terms
```

### 简体中文（`/zh-cn/` 前缀）

```
/zh-cn/
/zh-cn/games
/zh-cn/games/[slug]
/zh-cn/arcade-games
...（其余同英文，加 /zh-cn/ 前缀）
```

---

## 各页面 Meta 模板

### 游戏详情页

```
title:       {游戏名} | {平台} {年份} | Play Free Retro Games Online
description: Play {游戏名} online for free. {平台} game from {年份}. {简介前100字}. No download required.

zh-cn:
title:       {游戏名} | {平台} {年份} | 免费线上玩复古遊戲
description: 免费在线玩{游戏名}。{平台}游戏，{年份}年发行。{简介}。无需下载。
```

### 平台列表页

```
title:       {Platform} Games Online - Play Free Classic {Platform} Games
description: Play free classic {Platform} games online. Browse {count} games including [top3游戏名]. No download required.
```

### 类型列表页

```
title:       {Genre} Retro Games Online - Play Free Classic {Genre} Games
description: Play free {genre} retro games online. Browse {count} games across {年份范围}. Instant play, no download.
```

### 系列列表页

```
title:       {Series} Games Online - Play Classic {Series} Games Free
description: Play all {Series} games online for free. {count} games available.
```

### 首页

```
title:       RetroVault - Play Free Retro Games Online | NES, SNES, GBA, Arcade & More
description: Play 2000+ classic retro games online for free. NES, SNES, GBA, Arcade, N64, PlayStation and more. No download, instant play in your browser.
```

---

## 结构化数据

### 游戏详情页（VideoGame）

```json
{
  "@context": "https://schema.org",
  "@type": "VideoGame",
  "name": "Super Mario Bros.: The Lost Levels",
  "description": "...",
  "gameEmulator": "NES",
  "applicationCategory": "Game",
  "operatingSystem": "Web Browser",
  "datePublished": "1986",
  "genre": ["Platformer"],
  "image": "https://...",
  "thumbnailUrl": "https://...",
  "inLanguage": "en",
  "isAccessibleForFree": true,
  "keywords": "NES, Platformer, 1986, Super Mario",
  "author": {
    "@type": "Organization",
    "name": "Nintendo"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Nintendo"
  },
  "gameSeries": "Super Mario",
  "additionalProperty": [
    {
      "@type": "PropertyValue",
      "name": "longDescription",
      "value": "..."
    }
  ]
}
```

### 首页（WebSite + SearchAction）

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "RetroVault",
  "url": "https://retrovault.cc",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://retrovault.cc/games?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}
```

### 列表页（ItemList）

```json
{
  "@context": "https://schema.org",
  "@type": "ItemList",
  "name": "Arcade Games",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "url": "https://retrovault.cc/games/mslug",
      "name": "Metal Slug"
    }
  ]
}
```

---

## 面包屑规范

```
游戏详情页:   Home > Games > {Platform} > {游戏名}
平台列表页:   Home > {Platform} Games
类型列表页:   Home > Game Genres > {Genre}
系列列表页:   Home > Game Series > {Series}
开发商页:     Home > Game Developer > {Developer}
年份页:       Home > Yearly Games > {Year}
标签页:       Home > Game Tags > {Tag}
主机百科页:   Home > Game Consoles > {Platform}
```

结构化数据同步输出 `BreadcrumbList`：

```json
{
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://retrovault.cc" },
    { "@type": "ListItem", "position": 2, "name": "Games", "item": "https://retrovault.cc/games" },
    { "@type": "ListItem", "position": 3, "name": "NES", "item": "https://retrovault.cc/nes-games" },
    { "@type": "ListItem", "position": 4, "name": "Super Mario Bros." }
  ]
}
```

---

## Sitemap 策略

### sitemap.xml 分组

```
sitemap-index.xml
├── sitemap-games.xml        所有游戏详情页（优先级 0.9）
├── sitemap-platforms.xml    平台列表页（优先级 0.8）
├── sitemap-genres.xml       类型页（优先级 0.7）
├── sitemap-series.xml       系列页（优先级 0.7）
├── sitemap-developers.xml   开发商页（优先级 0.6）
├── sitemap-years.xml        年份页（优先级 0.5）
├── sitemap-tags.xml         标签页（优先级 0.5）
├── sitemap-consoles.xml     主机百科页（优先级 0.7）
├── sitemap-blogs.xml        博客（优先级 0.6）
└── sitemap-static.xml       静态页（优先级 0.3）
```

### 多语言 hreflang

每个页面在 `<head>` 中输出：

```html
<link rel="alternate" hreflang="en"    href="https://retrovault.cc/games/slug" />
<link rel="alternate" hreflang="zh-CN" href="https://retrovault.cc/zh-cn/games/slug" />
<link rel="alternate" hreflang="x-default" href="https://retrovault.cc/games/slug" />
```

---

## robots.txt

```
User-agent: *
Allow: /

Sitemap: https://retrovault.cc/sitemap.xml

# 不收录管理后台（如有）
Disallow: /admin/
Disallow: /api/
```

---

## 内链策略

### 游戏详情页内链

- 平台名 → 平台列表页
- 年份 → 年份页
- 类型 → 类型列表页
- 开发商 → 开发商页
- 系列 → 系列页
- 标签 → 标签页
- 相关游戏 → 其他游戏详情页

### 列表页内链

- 侧边栏：所有平台/类型/系列/标签页
- 底部：主机百科页入口
- 面包屑：上级页面

### 关键原则
每个游戏详情页至少有 **7个内链出口** + **来自列表页的入链**，形成密集网状结构。
