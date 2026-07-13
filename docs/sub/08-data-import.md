# 08 — 数据导入方案

> 将 scraper.mjs 抓取的 all_games.json 导入 Cloudflare D1  
> 一次性操作，后续通过管理脚本维护

---

## 数据流

```
scraper.mjs
    ↓
data/all_games.json
data/ejs_config.json
data/rom_map.json
    ↓
import.mjs（本文档）
    ↓
Cloudflare D1（games / platforms / genres / series / developers / tags 等表）
    ↓
Nuxt SSR/SSG 读取 D1
```

---

## 导入脚本 `scripts/import.mjs`

```javascript
/**
 * 数据导入脚本
 * 将 scraper 抓取的 all_games.json 导入 Cloudflare D1
 *
 * 用法：
 *   node scripts/import.mjs                    全量导入
 *   node scripts/import.mjs --dry-run          模拟运行，不写入
 *   node scripts/import.mjs --slug=pokemon-ruby 单个游戏
 */

import { readFile }  from 'node:fs/promises'
import { join }      from 'node:path'

const ARGS    = new Set(process.argv.slice(2))
const DRY_RUN = ARGS.has('--dry-run')
const SLUG    = [...ARGS].find(a => a.startsWith('--slug='))?.split('=')[1]
const DATA_DIR = './data'

// D1 通过 wrangler 的 REST API 操作
// 本地用 wrangler d1 execute 命令批量写入
const D1_DATABASE_ID = process.env.CLOUDFLARE_D1_DATABASE_ID
const CF_API_TOKEN   = process.env.CLOUDFLARE_API_TOKEN
const CF_ACCOUNT_ID  = process.env.CLOUDFLARE_ACCOUNT_ID

// ─── 工具函数 ──────────────────────────────────────────────────────────────

const ts = () => new Date().toISOString()
const log = {
  info:  m => console.log(`[INFO]  ${ts()} ${m}`),
  ok:    m => console.log(`[OK]    ${ts()} ${m}`),
  warn:  m => console.warn(`[WARN]  ${ts()} ${m}`),
  error: m => console.error(`[ERROR] ${ts()} ${m}`),
}

function slugify(str) {
  if (!str) return ''
  return str
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

function sanitize(val) {
  if (val === '$undefined' || val === undefined || val === null) return null
  return val
}

// ─── D1 执行器（通过 Cloudflare REST API）─────────────────────────────────

async function execD1(sql) {
  if (DRY_RUN) {
    console.log('[DRY-RUN]', sql.substring(0, 120))
    return
  }

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/d1/database/${D1_DATABASE_ID}/query`,
    {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${CF_API_TOKEN}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({ sql }),
    }
  )

  const data = await res.json()
  if (!data.success) {
    throw new Error(`D1 error: ${JSON.stringify(data.errors)}`)
  }
  return data.result
}

// 批量执行（减少API调用次数）
async function execBatch(statements) {
  if (DRY_RUN) {
    log.info(`[DRY-RUN] batch ${statements.length} statements`)
    return
  }

  // D1 REST API 支持批量
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/d1/database/${D1_DATABASE_ID}/query`,
    {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${CF_API_TOKEN}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({ sql: statements.join(';\n') }),
    }
  )

  const data = await res.json()
  if (!data.success) {
    throw new Error(`D1 batch error: ${JSON.stringify(data.errors)}`)
  }
}

// ─── 建表 ──────────────────────────────────────────────────────────────────

async function createTables() {
  log.info('建表...')

  const ddl = `
    -- 平台表
    CREATE TABLE IF NOT EXISTS platforms (
      id              TEXT PRIMARY KEY,
      name            TEXT NOT NULL,
      slug            TEXT NOT NULL UNIQUE,
      ejs_core        TEXT,
      default_ext     TEXT,
      use_cdn         INTEGER DEFAULT 0,
      cdn_dir         TEXT,
      bios_path       TEXT DEFAULT '',
      description     TEXT,
      long_description TEXT,
      icon_url        TEXT,
      game_count      INTEGER DEFAULT 0,
      sort_order      INTEGER DEFAULT 0,
      manufacturer    TEXT,
      release_year    INTEGER,
      units_sold      TEXT,
      best_game       TEXT,
      lifespan        TEXT,
      tech_specs      TEXT,
      created_at      TEXT DEFAULT (datetime('now'))
    );

    -- 类型表
    CREATE TABLE IF NOT EXISTS genres (
      id         TEXT PRIMARY KEY,
      name       TEXT NOT NULL,
      slug       TEXT NOT NULL UNIQUE,
      game_count INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- 系列表
    CREATE TABLE IF NOT EXISTS series (
      id           TEXT PRIMARY KEY,
      name         TEXT NOT NULL,
      en_name      TEXT NOT NULL,
      slug         TEXT NOT NULL UNIQUE,
      game_count   INTEGER DEFAULT 0,
      platforms    TEXT,
      year_range   TEXT,
      sort_order   INTEGER DEFAULT 0,
      created_at   TEXT DEFAULT (datetime('now'))
    );

    -- 开发商表
    CREATE TABLE IF NOT EXISTS developers (
      id         TEXT PRIMARY KEY,
      name       TEXT NOT NULL,
      slug       TEXT NOT NULL UNIQUE,
      game_count INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- 标签表
    CREATE TABLE IF NOT EXISTS tags (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT NOT NULL UNIQUE,
      slug       TEXT NOT NULL UNIQUE,
      game_count INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- 游戏主表
    CREATE TABLE IF NOT EXISTS games (
      id              TEXT PRIMARY KEY,
      slug            TEXT NOT NULL UNIQUE,
      title           TEXT NOT NULL,
      platform_id     TEXT NOT NULL,
      year            INTEGER,
      genre_id        TEXT,
      developer_id    TEXT,
      publisher       TEXT,
      series_id       TEXT,
      is_hack         INTEGER NOT NULL DEFAULT 0,
      language        TEXT DEFAULT 'English',
      image_url       TEXT,
      local_cover     TEXT,
      cover_r2_key    TEXT,
      default_rom     TEXT,
      ejs_core        TEXT,
      ejs_bios_url    TEXT DEFAULT '',
      rom_core        TEXT,
      is_remote       INTEGER DEFAULT 0,
      description     TEXT,
      long_description TEXT,
      controls        TEXT,
      play_count      INTEGER DEFAULT 0,
      like_count      INTEGER DEFAULT 0,
      favorite_count  INTEGER DEFAULT 0,
      review_count    INTEGER DEFAULT 0,
      avg_rating      REAL DEFAULT 0,
      meta_title      TEXT,
      meta_description TEXT,
      status          TEXT DEFAULT 'published',
      sort_order      INTEGER DEFAULT 0,
      created_at      TEXT DEFAULT (datetime('now')),
      updated_at      TEXT DEFAULT (datetime('now'))
    );

    -- 游戏多语言
    CREATE TABLE IF NOT EXISTS game_translations (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id          TEXT NOT NULL,
      locale           TEXT NOT NULL,
      title            TEXT,
      description      TEXT,
      long_description TEXT,
      controls         TEXT,
      meta_title       TEXT,
      meta_description TEXT,
      translated_by    TEXT DEFAULT 'ai',
      reviewed         INTEGER DEFAULT 0,
      created_at       TEXT DEFAULT (datetime('now')),
      updated_at       TEXT DEFAULT (datetime('now')),
      UNIQUE(game_id, locale)
    );

    -- ROM版本表
    CREATE TABLE IF NOT EXISTS game_rom_versions (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id    TEXT NOT NULL,
      lang       TEXT NOT NULL DEFAULT 'default',
      filename   TEXT NOT NULL,
      r2_key     TEXT NOT NULL,
      rel_path   TEXT NOT NULL,
      source_url TEXT,
      file_size  INTEGER DEFAULT 0,
      file_ext   TEXT,
      is_default INTEGER DEFAULT 0,
      status     TEXT DEFAULT 'available',
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- 标签关联
    CREATE TABLE IF NOT EXISTS game_tags (
      game_id TEXT NOT NULL,
      tag_id  INTEGER NOT NULL,
      PRIMARY KEY (game_id, tag_id)
    );

    -- 相关游戏
    CREATE TABLE IF NOT EXISTS game_related (
      game_id         TEXT NOT NULL,
      related_game_id TEXT NOT NULL,
      sort_order      INTEGER DEFAULT 0,
      PRIMARY KEY (game_id, related_game_id)
    );

    -- 游戏统计
    CREATE TABLE IF NOT EXISTS game_stats (
      game_id        TEXT PRIMARY KEY,
      play_count     INTEGER DEFAULT 0,
      like_count     INTEGER DEFAULT 0,
      favorite_count INTEGER DEFAULT 0,
      review_count   INTEGER DEFAULT 0,
      avg_rating     REAL DEFAULT 0,
      updated_at     TEXT DEFAULT (datetime('now'))
    );

    -- 博客
    CREATE TABLE IF NOT EXISTS blogs (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      slug         TEXT NOT NULL UNIQUE,
      locale       TEXT NOT NULL DEFAULT 'en',
      title        TEXT NOT NULL,
      summary      TEXT,
      content      TEXT,
      cover_image  TEXT,
      tags         TEXT,
      author       TEXT DEFAULT 'RetroVault',
      view_count   INTEGER DEFAULT 0,
      status       TEXT DEFAULT 'published',
      published_at TEXT,
      created_at   TEXT DEFAULT (datetime('now')),
      updated_at   TEXT DEFAULT (datetime('now'))
    );

    -- 预留用户表
    CREATE TABLE IF NOT EXISTS users (
      id            TEXT PRIMARY KEY,
      username      TEXT NOT NULL UNIQUE,
      email         TEXT UNIQUE,
      password_hash TEXT,
      avatar_url    TEXT,
      nickname      TEXT,
      level         INTEGER DEFAULT 1,
      points        INTEGER DEFAULT 0,
      provider      TEXT DEFAULT 'email',
      provider_id   TEXT,
      is_verified   INTEGER DEFAULT 0,
      status        TEXT DEFAULT 'active',
      created_at    TEXT DEFAULT (datetime('now')),
      updated_at    TEXT DEFAULT (datetime('now'))
    );

    -- 预留收藏表
    CREATE TABLE IF NOT EXISTS user_favorites (
      user_id    TEXT NOT NULL,
      game_id    TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      PRIMARY KEY (user_id, game_id)
    );

    -- 预留点赞表
    CREATE TABLE IF NOT EXISTS user_likes (
      user_id    TEXT NOT NULL,
      game_id    TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      PRIMARY KEY (user_id, game_id)
    );

    -- 预留评论表
    CREATE TABLE IF NOT EXISTS user_reviews (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    TEXT NOT NULL,
      game_id    TEXT NOT NULL,
      rating     REAL NOT NULL,
      comment    TEXT,
      status     TEXT DEFAULT 'published',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, game_id)
    );

    -- 预留存档表
    CREATE TABLE IF NOT EXISTS user_saves (
      id              TEXT PRIMARY KEY,
      user_id         TEXT NOT NULL,
      game_id         TEXT NOT NULL,
      platform        TEXT,
      save_name       TEXT DEFAULT 'Auto Save',
      save_data       TEXT,
      screenshot_data TEXT,
      slot            INTEGER DEFAULT 1,
      created_at      TEXT DEFAULT (datetime('now')),
      updated_at      TEXT DEFAULT (datetime('now'))
    );

    -- 预留游戏历史
    CREATE TABLE IF NOT EXISTS user_play_history (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id   TEXT NOT NULL,
      game_id   TEXT NOT NULL,
      play_time INTEGER DEFAULT 0,
      played_at TEXT DEFAULT (datetime('now'))
    );

    -- 索引
    CREATE INDEX IF NOT EXISTS idx_games_platform   ON games(platform_id);
    CREATE INDEX IF NOT EXISTS idx_games_genre      ON games(genre_id);
    CREATE INDEX IF NOT EXISTS idx_games_series     ON games(series_id);
    CREATE INDEX IF NOT EXISTS idx_games_developer  ON games(developer_id);
    CREATE INDEX IF NOT EXISTS idx_games_year       ON games(year);
    CREATE INDEX IF NOT EXISTS idx_games_status     ON games(status);
    CREATE INDEX IF NOT EXISTS idx_games_is_hack    ON games(is_hack);
    CREATE INDEX IF NOT EXISTS idx_translations_game   ON game_translations(game_id);
    CREATE INDEX IF NOT EXISTS idx_translations_locale ON game_translations(locale);
    CREATE INDEX IF NOT EXISTS idx_rom_versions_game   ON game_rom_versions(game_id);
    CREATE INDEX IF NOT EXISTS idx_reviews_game        ON user_reviews(game_id);
    CREATE INDEX IF NOT EXISTS idx_history_user        ON user_play_history(user_id);
    CREATE INDEX IF NOT EXISTS idx_blogs_locale        ON blogs(locale);
    CREATE INDEX IF NOT EXISTS idx_blogs_status        ON blogs(status);
  `

  await execD1(ddl)
  log.ok('建表完成')
}

// ─── 平台种子数据 ──────────────────────────────────────────────────────────

const PLATFORM_SEEDS = [
  { id: 'arcade', name: 'Arcade',              slug: 'arcade-games',         ejsCore: 'arcade',      ext: 'zip',  useCdn: 1, cdnDir: 'arcade' },
  { id: 'nes',    name: 'NES',                 slug: 'nes-games',            ejsCore: 'nes',         ext: 'nes',  useCdn: 0, cdnDir: null },
  { id: 'snes',   name: 'SNES',                slug: 'snes-games',           ejsCore: 'snes',        ext: 'smc',  useCdn: 0, cdnDir: null },
  { id: 'gba',    name: 'Game Boy Advance',     slug: 'gba-games',            ejsCore: 'gba',         ext: 'gba',  useCdn: 1, cdnDir: 'gba'  },
  { id: 'n64',    name: 'Nintendo 64',          slug: 'n64-games',            ejsCore: 'n64',         ext: 'n64',  useCdn: 1, cdnDir: 'n64'  },
  { id: 'ps',     name: 'PlayStation',          slug: 'ps-games',             ejsCore: 'psx',         ext: 'psx',  useCdn: 1, cdnDir: 'ps', biosPath: '/bios/scph1001.bin' },
  { id: 'genesis',name: 'Genesis',              slug: 'genesis-games',        ejsCore: 'segaMD',      ext: 'md',   useCdn: 0, cdnDir: null },
  { id: 'gb',     name: 'Game Boy',             slug: 'game-boy-games',       ejsCore: 'gb',          ext: 'zip',  useCdn: 0, cdnDir: null },
  { id: 'nds',    name: 'Nintendo DS',          slug: 'nds-games',            ejsCore: 'nds',         ext: 'nds',  useCdn: 1, cdnDir: 'nds'  },
  { id: 'sms',    name: 'Sega Master System',   slug: 'sms-games',            ejsCore: 'segaMS',      ext: 'zip',  useCdn: 0, cdnDir: null },
  { id: 'pce',    name: 'PC Engine CD',         slug: 'pce-games',            ejsCore: 'pce',         ext: 'zip',  useCdn: 0, cdnDir: null, biosPath: '/bios/syscard3.pce' },
  { id: 'gg',     name: 'Game Gear',            slug: 'game-gear-games',      ejsCore: 'segaGG',      ext: 'gg',   useCdn: 0, cdnDir: null },
  { id: 'jaguar', name: 'Atari Jaguar',         slug: 'jaguar-games',         ejsCore: 'jaguar',      ext: 'zip',  useCdn: 0, cdnDir: null },
  { id: 'ws',     name: 'Bandai WonderSwan',    slug: 'ws-games',             ejsCore: 'ws',          ext: 'ws',   useCdn: 0, cdnDir: null },
  { id: 'segacd', name: 'Sega CD',              slug: 'sega-cd-games',        ejsCore: 'segaCD',      ext: 'zip',  useCdn: 0, cdnDir: null, biosPath: '/bios/bios_CD_U.bin' },
  { id: 'sega32x',name: 'Sega 32X',             slug: 'sega-32x-games',       ejsCore: 'sega32x',     ext: 'zip',  useCdn: 0, cdnDir: null },
  { id: 'ngp',    name: 'NeoGeo Pocket',        slug: 'ngp-games',            ejsCore: 'ngp',         ext: 'ngc',  useCdn: 0, cdnDir: null },
  { id: 'vb',     name: 'Virtual Boy',          slug: 'vb-games',             ejsCore: 'vb',          ext: 'zip',  useCdn: 0, cdnDir: null },
  { id: 'ss',     name: 'Sega Saturn',          slug: 'ss-games',             ejsCore: 'segaSaturn',  ext: 'zip',  useCdn: 0, cdnDir: null, biosPath: '/bios/saturn_bios.bin' },
  { id: 'fds',    name: 'Famicom Disk System',  slug: 'fds-games',            ejsCore: 'nes',         ext: 'zip',  useCdn: 0, cdnDir: null },
  { id: 'msx2',   name: 'MSX2',                 slug: 'msx2-games',           ejsCore: 'msx',         ext: '7z',   useCdn: 0, cdnDir: null },
  { id: 'coleco', name: 'ColecoVision',         slug: 'coleco-vision-games',  ejsCore: 'coleco',      ext: 'zip',  useCdn: 0, cdnDir: null, biosPath: '/bios/colecovision.rom' },
  { id: 'c64',    name: 'Commodore 64',         slug: 'c64-games',            ejsCore: 'c64',         ext: 'zip',  useCdn: 0, cdnDir: null },
]

async function importPlatforms() {
  log.info('导入平台数据...')
  const stmts = PLATFORM_SEEDS.map(p => `
    INSERT OR IGNORE INTO platforms
      (id, name, slug, ejs_core, default_ext, use_cdn, cdn_dir, bios_path)
    VALUES
      ('${p.id}','${p.name}','${p.slug}','${p.ejsCore}','${p.ext}',${p.useCdn},'${p.cdnDir || ''}','${p.biosPath || ''}')
  `)
  await execBatch(stmts)
  log.ok(`平台导入完成: ${PLATFORM_SEEDS.length} 个`)
}

// ─── 平台名 → ID 映射（与爬虫数据对齐）───────────────────────────────────

const PLATFORM_NAME_TO_ID = {
  'Arcade':              'arcade',
  'NES':                 'nes',
  'SNES':                'snes',
  'Game Boy Advance':    'gba',
  'Nintendo 64':         'n64',
  'PlayStation':         'ps',
  'Genesis':             'genesis',
  'Game Boy':            'gb',
  'Nintendo DS':         'nds',
  'Sega Master System':  'sms',
  'PC Engine CD':        'pce',
  'Game Gear':           'gg',
  'Atari Jaguar':        'jaguar',
  'Bandai WonderSwan':   'ws',
  'Sega CD':             'segacd',
  'Sega 32X':            'sega32x',
  'NeoGeo Pocket':       'ngp',
  'Virtual Boy':         'vb',
  'Sega Saturn':         'ss',
  'Famicom Disk System': 'fds',
  'MSX2':                'msx2',
  'ColecoVision':        'coleco',
  'Commodore 64':        'c64',
}

// ─── 主导入逻辑 ────────────────────────────────────────────────────────────

async function importGames(games) {
  log.info(`开始导入 ${games.length} 个游戏...`)

  // 收集所有维度数据
  const genreMap    = new Map()  // name → id
  const seriesMap   = new Map()  // enName → id
  const developerMap = new Map() // name → id
  const tagMap      = new Map()  // name → id

  let imported = 0
  let failed   = 0

  for (const g of games) {
    if (SLUG && g.slug !== SLUG) continue

    try {
      const slug       = g.slug
      const platformId = PLATFORM_NAME_TO_ID[g.platform] || slugify(g.platform)

      // ── 类型 ───────────────────────────────────────────────────────────
      let genreId = null
      if (g.genre) {
        if (!genreMap.has(g.genre)) {
          const id = slugify(g.genre)
          genreMap.set(g.genre, id)
          await execD1(`
            INSERT OR IGNORE INTO genres (id, name, slug)
            VALUES ('${id}', '${esc(g.genre)}', '${id}-games')
          `)
        }
        genreId = genreMap.get(g.genre)
      }

      // ── 系列 ───────────────────────────────────────────────────────────
      let seriesId = null
      if (g.series) {
        if (!seriesMap.has(g.series)) {
          const id = slugify(g.series)
          seriesMap.set(g.series, id)
          await execD1(`
            INSERT OR IGNORE INTO series (id, name, en_name, slug)
            VALUES ('${id}', '${esc(g.series)}', '${esc(g.series)}', '${id}-games')
          `)
        }
        seriesId = seriesMap.get(g.series)
      }

      // ── 开发商 ─────────────────────────────────────────────────────────
      let developerId = null
      if (g.developer) {
        const devName = sanitize(g.developer)
        if (devName) {
          if (!developerMap.has(devName)) {
            const id = slugify(devName)
            developerMap.set(devName, id)
            await execD1(`
              INSERT OR IGNORE INTO developers (id, name, slug)
              VALUES ('${id}', '${esc(devName)}', '${id}-games')
            `)
          }
          developerId = developerMap.get(devName)
        }
      }

      // ── 游戏主记录 ─────────────────────────────────────────────────────
      const isHack    = sanitize(g.isHack) ? 1 : 0
      const longDesc  = JSON.stringify(g.longDescription || [])
      const controls  = JSON.stringify(g.controls || {})
      const defaultRom = sanitize(g.defaultRom)

      await execD1(`
        INSERT OR REPLACE INTO games (
          id, slug, title, platform_id, year, genre_id,
          developer_id, publisher, series_id, is_hack, language,
          image_url, local_cover, cover_r2_key,
          default_rom, ejs_core, ejs_bios_url,
          description, long_description, controls,
          status, updated_at
        ) VALUES (
          '${slug}', '${slug}',
          '${esc(g.title)}',
          '${platformId}',
          ${g.year || 'NULL'},
          ${genreId ? `'${genreId}'` : 'NULL'},
          ${developerId ? `'${developerId}'` : 'NULL'},
          ${g.publisher ? `'${esc(g.publisher)}'` : 'NULL'},
          ${seriesId ? `'${seriesId}'` : 'NULL'},
          ${isHack},
          '${esc(g.language || 'English')}',
          ${g.imageUrl    ? `'${esc(g.imageUrl)}'`    : 'NULL'},
          ${g.localCover  ? `'${esc(g.localCover)}'`  : 'NULL'},
          ${g.localCover  ? `'${esc(g.localCover)}'`  : 'NULL'},
          ${defaultRom    ? `'${esc(defaultRom)}'`     : 'NULL'},
          '${g.ejs?.core || 'nes'}',
          '${g.ejs?.biosUrl || ''}',
          ${g.description ? `'${esc(g.description)}'` : 'NULL'},
          '${esc(longDesc)}',
          '${esc(controls)}',
          'published',
          datetime('now')
        )
      `)

      // ── game_stats 初始化 ──────────────────────────────────────────────
      await execD1(`
        INSERT OR IGNORE INTO game_stats (game_id)
        VALUES ('${slug}')
      `)

      // ── ROM版本 ────────────────────────────────────────────────────────
      const roms = g.localRoms || []
      for (let i = 0; i < roms.length; i++) {
        const rom      = roms[i]
        if (!rom.relPath) continue
        const ext      = rom.filename?.split('.').pop() || ''
        const isDefault = (i === 0 || rom.lang === 'default') ? 1 : 0

        await execD1(`
          INSERT OR REPLACE INTO game_rom_versions
            (game_id, lang, filename, r2_key, rel_path, source_url, file_size, file_ext, is_default, status)
          VALUES (
            '${slug}',
            '${esc(rom.lang || 'default')}',
            '${esc(rom.filename || '')}',
            '${esc(rom.relPath)}',
            '${esc(rom.relPath)}',
            ${rom.url ? `'${esc(rom.url)}'` : 'NULL'},
            ${rom.size || 0},
            '${ext}',
            ${isDefault},
            'available'
          )
        `)
      }

      // ── 标签 ───────────────────────────────────────────────────────────
      const tags = Array.isArray(g.tags) ? g.tags : []
      for (const tagName of tags) {
        if (!tagName) continue
        if (!tagMap.has(tagName)) {
          const tagSlug = slugify(tagName)
          await execD1(`
            INSERT OR IGNORE INTO tags (name, slug)
            VALUES ('${esc(tagName)}', '${esc(tagSlug)}')
          `)
          // 查询刚插入的ID
          const row = await execD1(`SELECT id FROM tags WHERE name = '${esc(tagName)}'`)
          const tagId = row?.[0]?.results?.[0]?.id
          if (tagId) tagMap.set(tagName, tagId)
        }
        const tagId = tagMap.get(tagName)
        if (tagId) {
          await execD1(`
            INSERT OR IGNORE INTO game_tags (game_id, tag_id)
            VALUES ('${slug}', ${tagId})
          `)
        }
      }

      // ── 相关游戏 ───────────────────────────────────────────────────────
      const related = Array.isArray(g.relatedGames) ? g.relatedGames : []
      for (let i = 0; i < related.length; i++) {
        const relSlug = typeof related[i] === 'string' ? related[i] : related[i]?.id
        if (!relSlug || relSlug === slug) continue
        await execD1(`
          INSERT OR IGNORE INTO game_related (game_id, related_game_id, sort_order)
          VALUES ('${slug}', '${relSlug}', ${i})
        `)
      }

      imported++
      if (imported % 100 === 0) log.ok(`进度: ${imported}/${games.length}`)

    } catch (err) {
      log.error(`导入失败 [${g.slug}]: ${err.message}`)
      failed++
    }
  }

  log.ok(`游戏导入完成: 成功 ${imported} | 失败 ${failed}`)
  return { imported, failed }
}

// ─── 更新统计计数 ──────────────────────────────────────────────────────────

async function updateCounts() {
  log.info('更新统计计数...')

  await execD1(`
    UPDATE platforms SET game_count = (
      SELECT COUNT(*) FROM games
      WHERE games.platform_id = platforms.id AND games.status = 'published'
    )
  `)

  await execD1(`
    UPDATE genres SET game_count = (
      SELECT COUNT(*) FROM games
      WHERE games.genre_id = genres.id AND games.status = 'published'
    )
  `)

  await execD1(`
    UPDATE series SET game_count = (
      SELECT COUNT(*) FROM games
      WHERE games.series_id = series.id AND games.status = 'published'
    )
  `)

  await execD1(`
    UPDATE developers SET game_count = (
      SELECT COUNT(*) FROM games
      WHERE games.developer_id = developers.id AND games.status = 'published'
    )
  `)

  await execD1(`
    UPDATE tags SET game_count = (
      SELECT COUNT(*) FROM game_tags
      WHERE game_tags.tag_id = tags.id
    )
  `)

  log.ok('统计计数更新完成')
}

// ─── SQL 转义工具 ──────────────────────────────────────────────────────────

function esc(str) {
  if (str === null || str === undefined) return ''
  return String(str).replace(/'/g, "''")
}

// ─── 主流程 ────────────────────────────────────────────────────────────────

async function main() {
  // 检查环境变量
  if (!DRY_RUN) {
    if (!CF_API_TOKEN || !CF_ACCOUNT_ID || !D1_DATABASE_ID) {
      log.error('缺少环境变量: CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_D1_DATABASE_ID')
      process.exit(1)
    }
  }

  log.info(`模式: ${DRY_RUN ? 'DRY-RUN（不写入）' : '正式导入'}`)
  if (SLUG) log.info(`单游戏模式: ${SLUG}`)

  // 读取游戏数据
  const allGamesPath = join(DATA_DIR, 'all_games.json')
  log.info(`读取数据: ${allGamesPath}`)
  const allData = JSON.parse(await readFile(allGamesPath, 'utf8'))
  const games   = allData.games || []
  log.info(`共 ${games.length} 个游戏`)

  // 执行导入
  await createTables()
  await importPlatforms()
  const { imported, failed } = await importGames(games)
  await updateCounts()

  log.ok('')
  log.ok('════ 导入完成 ════')
  log.ok(`成功: ${imported}`)
  log.ok(`失败: ${failed}`)
}

main().catch(err => {
  log.error(`致命错误: ${err.message}`)
  console.error(err)
  process.exit(1)
})
```

---

## 本地开发 wrangler 方式

本地开发时，可以用 wrangler 直接操作本地 D1：

```bash
# 创建本地 D1 数据库
wrangler d1 create retrovault-db

# 执行 SQL 文件（建表）
wrangler d1 execute retrovault-db --local --file=./scripts/schema.sql

# 导入数据（通过脚本）
node scripts/import.mjs --dry-run     # 先验证
node scripts/import.mjs               # 正式导入

# 查询验证
wrangler d1 execute retrovault-db --local --command="SELECT COUNT(*) FROM games"
wrangler d1 execute retrovault-db --local --command="SELECT * FROM platforms"
```

---

## wrangler.toml 配置

```toml
name = "retrovault"
compatibility_date = "2024-01-01"

[[d1_databases]]
binding     = "DB"
database_name = "retrovault-db"
database_id   = "your-d1-database-id"

[[r2_buckets]]
binding     = "ROMS"
bucket_name = "retrovault-roms"

[vars]
ROMS_BASE_URL = "https://roms.retrovault.online"
```

---

## Nuxt 中使用 D1

```typescript
// server/utils/db.ts
export function useDB(event: H3Event) {
  const { DB } = event.context.cloudflare.env
  return DB  // D1Database
}

// server/api/games/[slug].get.ts
export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  const db   = useDB(event)

  const game = await db
    .prepare(`
      SELECT
        g.*,
        p.name   AS platform_name,
        p.slug   AS platform_slug,
        gen.name AS genre_name,
        gen.slug AS genre_slug,
        s.en_name AS series_name,
        s.slug   AS series_slug,
        d.name   AS developer_name,
        d.slug   AS developer_slug
      FROM games g
      LEFT JOIN platforms  p   ON g.platform_id  = p.id
      LEFT JOIN genres     gen ON g.genre_id     = gen.id
      LEFT JOIN series     s   ON g.series_id    = s.id
      LEFT JOIN developers d   ON g.developer_id = d.id
      WHERE g.slug = ? AND g.status = 'published'
    `)
    .bind(slug)
    .first()

  if (!game) throw createError({ statusCode: 404 })

  // 查询ROM版本
  const { results: roms } = await db
    .prepare(`SELECT * FROM game_rom_versions WHERE game_id = ? AND status = 'available'`)
    .bind(slug)
    .all()

  // 查询标签
  const { results: tags } = await db
    .prepare(`
      SELECT t.name, t.slug FROM tags t
      JOIN game_tags gt ON t.id = gt.tag_id
      WHERE gt.game_id = ?
    `)
    .bind(slug)
    .all()

  // 查询相关游戏（最多6个）
  const { results: related } = await db
    .prepare(`
      SELECT g.slug, g.title, g.local_cover, g.platform_id, g.year, g.genre_id
      FROM game_related gr
      JOIN games g ON gr.related_game_id = g.slug
      WHERE gr.game_id = ? AND g.status = 'published'
      ORDER BY gr.sort_order
      LIMIT 6
    `)
    .bind(slug)
    .all()

  return { ...game, roms, tags, related }
})
```
