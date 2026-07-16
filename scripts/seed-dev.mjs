// seed-dev.mjs — 从本地抽取小部分游戏数据，生成 SQL 插入远程 D1
//
// 用法:
//   node scripts/seed-dev.mjs                          # 生成 scripts/seed-dev.sql
//   cat scripts/seed-dev.sql | wrangler d1 execute retrovault --remote
//
// 抽取策略: 按 platform 均匀覆盖, 每种平台 2~3 个
// 覆盖: nes, snes, game-boy-advance, genesis, arcade, n64, psx

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

// ─── 配置 ───────────────────────────────────────────────
const GAMES_DIR = resolve(ROOT, 'retrovault-scraper/data/games')
const GAME_LIST_PATH = resolve(ROOT, 'retrovault-scraper/data/game_list.json')
const OUTPUT_PATH = resolve(ROOT, 'scripts/seed-dev.sql')

// 每种 platform 抽 N 个
const PER_PLATFORM = 2
// 目标 platforms (覆盖主要模拟器核心)
const TARGET_PLATFORMS = [
  'nes',
  'snes',
  'game-boy-advance',
  'genesis',
  'arcade',
  'nintendo-64',
  'playstation',
]

// ─── 从 game.json 读取 platform 并分组 ────────────────────
const byPlatform = {}
for (const slug of Object.keys(JSON.parse(readFileSync(GAME_LIST_PATH, 'utf-8')).games)) {
  const gjPath = resolve(GAMES_DIR, slug, 'game.json')
  if (!existsSync(gjPath)) continue
  const g = JSON.parse(readFileSync(gjPath, 'utf-8'))
  const p = g.platform
  if (!byPlatform[p]) byPlatform[p] = []
  byPlatform[p].push(slug)
}

// ─── 选取 slugs ──────────────────────────────────────────
const selected = new Set()
for (const p of TARGET_PLATFORMS) {
  const pool = (byPlatform[p] || []).filter(s => !selected.has(s))
  for (let i = 0; i < Math.min(PER_PLATFORM, pool.length); i++) {
    const offset = Math.floor((pool.length / (PER_PLATFORM + 1)) * (i + 1))
    const idx = Math.min(offset, pool.length - 1)
    selected.add(pool[idx])
  }
}

console.log(`Selected ${selected.size} games (${TARGET_PLATFORMS.length} platforms):`)
for (const s of selected) {
  const gjPath = resolve(GAMES_DIR, s, 'game.json')
  const p = JSON.parse(readFileSync(gjPath, 'utf-8')).platform
  console.log(`  ${s.padEnd(40)} ${p}`)
}

// ─── 读取 game.json 并构建 SQL ──────────────────────────
const escaper = (v) => {
  if (v === null || v === undefined) return 'NULL'
  const s = String(v)
  // SQLite 中单引号转义: ' -> ''
  return `'${s.replace(/'/g, "''")}'`
}

const rows = []
for (const slug of selected) {
  const gameDir = resolve(GAMES_DIR, slug)
  const gameJsonPath = resolve(gameDir, 'game.json')
  if (!existsSync(gameJsonPath)) {
    console.warn(`  WARN: game.json not found for ${slug}, skipping`)
    continue
  }

  const g = JSON.parse(readFileSync(gameJsonPath, 'utf-8'))

  // isHack: "$undefined" → 0
  const isHack = g.isHack === '$undefined' || !g.isHack ? 0 : 1

  // langs: 只存 en
  const langs = {
    en: {
      title: g.title || '',
      description: g.description || '',
      longDescription: g.longDescription || [],
      controls: g.controls || {},
    },
  }

  // roms: localRoms 数组
  const roms = g.localRoms || []

  const now = new Date().toISOString().replace('T', ' ').slice(0, 19) // "2026-07-15 12:00:00"

  rows.push(`INSERT INTO games (
  slug, title, platform, year, genre, developer, publisher, series,
  isHack, language, coverUrl, imageUrl, defaultRom,
  ejsCore, ejsBiosUrl,
  tags, description, langs, roms,
  status, source, createdAt, updatedAt
) VALUES (
  ${escaper(g.slug)},
  ${escaper(g.title)},
  ${escaper(g.platform)},
  ${g.year || 'NULL'},
  ${escaper(g.genre)},
  ${escaper(g.developer)},
  ${escaper(g.publisher)},
  ${escaper(g.series)},
  ${isHack},
  ${escaper(g.language || 'English')},
  ${escaper(g.localCover)},
  ${escaper(g.imageUrl)},
  ${escaper(g.defaultRom)},
  ${escaper(g.ejs?.core)},
  ${escaper(g.ejs?.biosUrl)},
  ${escaper(JSON.stringify(g.tags || []))},
  ${escaper(g.description || '')},
  ${escaper(JSON.stringify(langs))},
  ${escaper(JSON.stringify(roms))},
  'published',
  ${escaper(g._source || 'scraped')},
  '${now}',
  '${now}'
);`)
}

// ─── 写入 SQL 文件 ──────────────────────────────────────
const sql = `-- seed-dev.sql — 本地开发种子数据
-- 生成时间: ${new Date().toISOString()}
-- 游戏数量: ${rows.length}
-- 覆盖平台: ${TARGET_PLATFORMS.join(', ')}

BEGIN TRANSACTION;

${rows.join('\n')}

COMMIT;
`

writeFileSync(OUTPUT_PATH, sql, 'utf-8')
console.log(`\nSQL written to ${OUTPUT_PATH}`)
console.log('Run: cat scripts/seed-dev.sql | wrangler d1 execute retro-vault --remote')
