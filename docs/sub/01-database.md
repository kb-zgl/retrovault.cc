# 01 — 数据库设计

> 数据库：Cloudflare D1（SQLite 语法）  
> 原则：以爬虫抓取的游戏数据结构为基础，预留用户互动字段，支持后期扩展

---

## 表结构总览

| 表名 | 用途 |
|------|------|
| `games` | 游戏主表 |
| `game_translations` | 游戏多语言内容 |
| `game_tags` | 游戏标签关联 |
| `game_related` | 相关游戏关联 |
| `game_rom_versions` | ROM多语言/多版本文件 |
| `platforms` | 平台表 |
| `genres` | 类型表 |
| `series` | 系列表 |
| `developers` | 开发商表 |
| `tags` | 标签表 |
| `blogs` | 博客文章 |
| `users` | 用户表（预留） |
| `user_favorites` | 用户收藏（预留） |
| `user_likes` | 用户点赞（预留） |
| `user_reviews` | 用户评论（预留） |
| `user_saves` | 游戏存档（预留） |
| `game_stats` | 游戏统计（播放数/点赞数） |

---

## 详细表结构

### games（游戏主表）

```sql
CREATE TABLE games (
  -- 基础标识
  id            TEXT PRIMARY KEY,          -- slug，如 super-mario-bros
  slug          TEXT NOT NULL UNIQUE,

  -- 核心元数据
  title         TEXT NOT NULL,             -- 英文标题
  platform_id   TEXT NOT NULL,             -- 关联 platforms.id
  year          INTEGER,                   -- 发行年份
  genre_id      TEXT,                      -- 关联 genres.id
  developer_id  TEXT,                      -- 关联 developers.id
  publisher     TEXT,
  series_id     TEXT,                      -- 关联 series.id
  is_hack       INTEGER NOT NULL DEFAULT 0, -- 0=正版 1=改版
  language      TEXT DEFAULT 'English',    -- 游戏内语言（显示用）

  -- 媒体
  image_url     TEXT,                      -- 原始封面URL（classicgamezone）
  local_cover   TEXT,                      -- R2路径，如 covers/slug.webp
  cover_r2_key  TEXT,                      -- R2对象key

  -- ROM
  default_rom   TEXT,                      -- 默认ROM的R2路径
  ejs_core      TEXT,                      -- EmulatorJS core，如 nes/gba/arcade
  ejs_bios_url  TEXT DEFAULT '',           -- BIOS路径（部分平台需要）
  rom_core      TEXT,                      -- 自定义core（覆盖ejs_core）
  is_remote     INTEGER DEFAULT 0,         -- 是否远程加载模式

  -- 内容
  description      TEXT,                   -- 简短描述（1-2句）
  long_description TEXT,                   -- 详细介绍（JSON数组，段落列表）
  controls         TEXT,                   -- 操作说明（JSON对象）

  -- 统计（冗余字段，避免频繁JOIN）
  play_count    INTEGER DEFAULT 0,
  like_count    INTEGER DEFAULT 0,
  favorite_count INTEGER DEFAULT 0,
  review_count  INTEGER DEFAULT 0,
  avg_rating    REAL DEFAULT 0,

  -- SEO
  meta_title       TEXT,                   -- 自定义meta title（空则自动生成）
  meta_description TEXT,                   -- 自定义meta description

  -- 状态
  status        TEXT DEFAULT 'published',  -- published / draft / hidden
  sort_order    INTEGER DEFAULT 0,         -- 手动排序权重

  -- 时间
  created_at    TEXT DEFAULT (datetime('now')),
  updated_at    TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_games_platform ON games(platform_id);
CREATE INDEX idx_games_genre    ON games(genre_id);
CREATE INDEX idx_games_series   ON games(series_id);
CREATE INDEX idx_games_developer ON games(developer_id);
CREATE INDEX idx_games_year     ON games(year);
CREATE INDEX idx_games_status   ON games(status);
CREATE INDEX idx_games_is_hack  ON games(is_hack);
```

---

### game_translations（游戏多语言内容）

```sql
CREATE TABLE game_translations (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id     TEXT NOT NULL REFERENCES games(id),
  locale      TEXT NOT NULL,               -- zh-cn / ja / es / pt 等

  title            TEXT,                   -- 本地化标题
  description      TEXT,                   -- 本地化简介
  long_description TEXT,                   -- 本地化详细介绍（JSON数组）
  controls         TEXT,                   -- 本地化操作说明（JSON对象）
  meta_title       TEXT,
  meta_description TEXT,

  -- 翻译质量标记
  translated_by  TEXT DEFAULT 'ai',        -- ai / human
  reviewed       INTEGER DEFAULT 0,        -- 0=未审核 1=已审核

  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),

  UNIQUE(game_id, locale)
);

CREATE INDEX idx_translations_game   ON game_translations(game_id);
CREATE INDEX idx_translations_locale ON game_translations(locale);
```

---

### game_rom_versions（ROM多版本）

```sql
CREATE TABLE game_rom_versions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id     TEXT NOT NULL REFERENCES games(id),

  lang        TEXT NOT NULL DEFAULT 'default', -- en/ja/zh-cn/disc1/disc2等
  filename    TEXT NOT NULL,
  r2_key      TEXT NOT NULL,               -- R2对象key
  rel_path    TEXT NOT NULL,               -- 相对路径，如 roms/nes/slug.nes
  source_url  TEXT,                        -- 原始下载来源URL
  file_size   INTEGER DEFAULT 0,           -- 字节数
  file_ext    TEXT,                        -- 扩展名，如 nes/zip/gba
  is_default  INTEGER DEFAULT 0,           -- 1=该游戏的默认ROM版本
  status      TEXT DEFAULT 'available',    -- available / missing / removed

  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_rom_versions_game ON game_rom_versions(game_id);
```

---

### game_tags（游戏-标签关联）

```sql
CREATE TABLE game_tags (
  game_id TEXT NOT NULL REFERENCES games(id),
  tag_id  INTEGER NOT NULL REFERENCES tags(id),
  PRIMARY KEY (game_id, tag_id)
);
```

---

### game_related（相关游戏关联）

```sql
CREATE TABLE game_related (
  game_id         TEXT NOT NULL REFERENCES games(id),
  related_game_id TEXT NOT NULL REFERENCES games(id),
  sort_order      INTEGER DEFAULT 0,
  PRIMARY KEY (game_id, related_game_id)
);
```

---

### platforms（平台表）

```sql
CREATE TABLE platforms (
  id          TEXT PRIMARY KEY,            -- arcade / nes / snes / gba 等
  name        TEXT NOT NULL,               -- 显示名，如 Game Boy Advance
  slug        TEXT NOT NULL UNIQUE,        -- URL用，如 game-boy-advance
  ejs_core    TEXT,                        -- 默认EmulatorJS core
  default_ext TEXT,                        -- 默认ROM扩展名
  use_cdn     INTEGER DEFAULT 0,           -- 1=走R2 CDN路径
  cdn_dir     TEXT,                        -- CDN子目录名，如 gba
  bios_path   TEXT DEFAULT '',             -- BIOS文件路径

  -- 展示
  description TEXT,                        -- 平台介绍（首页卡片用）
  long_description TEXT,                   -- 主机百科页内容（JSON段落）
  icon_url    TEXT,
  game_count  INTEGER DEFAULT 0,           -- 冗余，避免COUNT查询
  sort_order  INTEGER DEFAULT 0,

  -- 历史信息（主机百科页用）
  manufacturer    TEXT,
  release_year    INTEGER,
  units_sold      TEXT,                    -- 如 "81 million"
  best_game       TEXT,
  lifespan        TEXT,
  tech_specs      TEXT,                    -- JSON

  created_at TEXT DEFAULT (datetime('now'))
);
```

---

### genres（类型表）

```sql
CREATE TABLE genres (
  id         TEXT PRIMARY KEY,             -- platformer / rpg / fighting 等
  name       TEXT NOT NULL,               -- 显示名，如 Platformer
  slug       TEXT NOT NULL UNIQUE,        -- URL用，如 platformer-games
  game_count INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
```

---

### series（系列表）

```sql
CREATE TABLE series (
  id           TEXT PRIMARY KEY,           -- super-mario / pokemon 等
  name         TEXT NOT NULL,              -- 本地化名称（爬虫来源可能是中文）
  en_name      TEXT NOT NULL,              -- 英文名（URL用）
  slug         TEXT NOT NULL UNIQUE,       -- URL用，如 super-mario-games
  game_count   INTEGER DEFAULT 0,
  platforms    TEXT,                       -- JSON数组
  year_range   TEXT,                       -- 如 "1985-2024"
  sort_order   INTEGER DEFAULT 0,
  created_at   TEXT DEFAULT (datetime('now'))
);
```

---

### developers（开发商表）

```sql
CREATE TABLE developers (
  id         TEXT PRIMARY KEY,             -- nintendo / capcom 等
  name       TEXT NOT NULL,
  slug       TEXT NOT NULL UNIQUE,         -- URL用，如 nintendo-games
  game_count INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
```

---

### tags（标签表）

```sql
CREATE TABLE tags (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL UNIQUE,         -- 如 8-bit / co-op / boss-fights
  slug       TEXT NOT NULL UNIQUE,         -- URL用
  game_count INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
```

---

### blogs（博客文章）

```sql
CREATE TABLE blogs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  slug        TEXT NOT NULL UNIQUE,
  locale      TEXT NOT NULL DEFAULT 'en',

  title       TEXT NOT NULL,
  summary     TEXT,
  content     TEXT,                        -- Markdown
  cover_image TEXT,
  tags        TEXT,                        -- JSON数组

  author      TEXT DEFAULT 'RetroVault',
  view_count  INTEGER DEFAULT 0,
  status      TEXT DEFAULT 'published',    -- published / draft

  published_at TEXT,
  created_at   TEXT DEFAULT (datetime('now')),
  updated_at   TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_blogs_locale ON blogs(locale);
CREATE INDEX idx_blogs_status ON blogs(status);
```

---

### game_stats（游戏统计）

```sql
CREATE TABLE game_stats (
  game_id      TEXT PRIMARY KEY REFERENCES games(id),
  play_count   INTEGER DEFAULT 0,
  like_count   INTEGER DEFAULT 0,
  favorite_count INTEGER DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  avg_rating   REAL DEFAULT 0,
  updated_at   TEXT DEFAULT (datetime('now'))
);
```

---

## 预留用户相关表（初期不启用，建表备用）

### users

```sql
CREATE TABLE users (
  id           TEXT PRIMARY KEY,           -- UUID
  username     TEXT NOT NULL UNIQUE,
  email        TEXT UNIQUE,
  password_hash TEXT,
  avatar_url   TEXT,
  nickname     TEXT,
  level        INTEGER DEFAULT 1,
  points       INTEGER DEFAULT 0,
  provider     TEXT DEFAULT 'email',       -- email / google / github
  provider_id  TEXT,
  is_verified  INTEGER DEFAULT 0,
  status       TEXT DEFAULT 'active',      -- active / banned
  created_at   TEXT DEFAULT (datetime('now')),
  updated_at   TEXT DEFAULT (datetime('now'))
);
```

### user_favorites

```sql
CREATE TABLE user_favorites (
  user_id    TEXT NOT NULL REFERENCES users(id),
  game_id    TEXT NOT NULL REFERENCES games(id),
  created_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, game_id)
);
```

### user_likes

```sql
CREATE TABLE user_likes (
  user_id    TEXT NOT NULL REFERENCES users(id),
  game_id    TEXT NOT NULL REFERENCES games(id),
  created_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, game_id)
);
```

### user_reviews

```sql
CREATE TABLE user_reviews (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    TEXT NOT NULL REFERENCES users(id),
  game_id    TEXT NOT NULL REFERENCES games(id),
  rating     REAL NOT NULL CHECK(rating >= 0.5 AND rating <= 5),
  comment    TEXT,
  status     TEXT DEFAULT 'published',     -- published / hidden
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, game_id)
);

CREATE INDEX idx_reviews_game ON user_reviews(game_id);
```

### user_saves（游戏存档）

```sql
CREATE TABLE user_saves (
  id              TEXT PRIMARY KEY,        -- UUID
  user_id         TEXT NOT NULL REFERENCES users(id),
  game_id         TEXT NOT NULL REFERENCES games(id),
  platform        TEXT,
  save_name       TEXT DEFAULT 'Auto Save',
  save_data       TEXT,                    -- Base64
  screenshot_data TEXT,                    -- Base64 PNG
  slot            INTEGER DEFAULT 1,
  created_at      TEXT DEFAULT (datetime('now')),
  updated_at      TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_saves_user_game ON user_saves(user_id, game_id);
```

### user_play_history

```sql
CREATE TABLE user_play_history (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    TEXT NOT NULL REFERENCES users(id),
  game_id    TEXT NOT NULL REFERENCES games(id),
  play_time  INTEGER DEFAULT 0,            -- 秒数
  played_at  TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_history_user ON user_play_history(user_id);
```

---

## 数据关系图

```
platforms ──< games >── genres
                │
                ├──< game_tags >── tags
                ├──< game_rom_versions
                ├──< game_translations
                ├──< game_related
                ├── series
                ├── developers
                └── game_stats

users ──< user_favorites >── games
users ──< user_likes     >── games
users ──< user_reviews   >── games
users ──< user_saves     >── games
users ──< user_play_history >── games
```
