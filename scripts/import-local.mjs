/**
 * Import scraper JSON data into local SQLite (for pnpm dev)
 *
 * Usage:
 *   node scripts/import-local.mjs              # Import all games
 *   node scripts/import-local.mjs --limit=10   # Import first 10
 *   node scripts/import-local.mjs --slug=mario # Import specific game
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import Database from 'better-sqlite3'

const DATA_DIR = join(process.cwd(), 'retrovault-scraper', 'data', 'games')
const DB_PATH = join(process.cwd(), '.data', 'retro-vault.sqlite')

const ARGS = new Set(process.argv.slice(2))
const SLUG = [...ARGS].find(a => a.startsWith('--slug='))?.split('=')[1]
const LIMIT = parseInt([...ARGS].find(a => a.startsWith('--limit='))?.split('=')[1] || '0')

if (!existsSync(DB_PATH)) {
  console.error(`[import] Database not found at ${DB_PATH}`)
  console.error('Run pnpm dev first to create the database.')
  process.exit(1)
}

const db = new Database(DB_PATH)

// Ensure table exists
db.exec(`CREATE TABLE IF NOT EXISTS games (
  slug TEXT PRIMARY KEY, title TEXT NOT NULL, platform TEXT NOT NULL,
  year INTEGER, genre TEXT, developer TEXT, publisher TEXT, series TEXT,
  isHack INTEGER DEFAULT 0, coverUrl TEXT, defaultRom TEXT,
  ejsCore TEXT, ejsBiosUrl TEXT, tags TEXT, description TEXT,
  langs TEXT, roms TEXT, status TEXT DEFAULT 'draft',
  source TEXT DEFAULT 'scraped', createdAt TEXT, updatedAt TEXT
)`)

const files = readdirSync(DATA_DIR).filter(f => f.endsWith('.json'))
let targetFiles = SLUG
  ? files.filter(f => f.startsWith(SLUG))
  : files

if (LIMIT > 0) targetFiles = targetFiles.slice(0, LIMIT)

console.log(`[import] Importing ${targetFiles.length}/${files.length} games into local SQLite...`)

const insert = db.prepare(`INSERT OR REPLACE INTO games
  (slug, title, platform, year, genre, developer, publisher, series, isHack,
   coverUrl, defaultRom, ejsCore, ejsBiosUrl, tags, description, langs, roms,
   status, source, createdAt, updatedAt)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', 'scraped', ?, ?)`)

const tx = db.transaction(() => {
  let count = 0
  for (const file of targetFiles) {
    try {
      const raw = readFileSync(join(DATA_DIR, file), 'utf-8')
      const g = JSON.parse(raw)
      const now = new Date().toISOString()

      insert.run(
        g.slug, g.title, g.platform, g.year || null, g.genre,
        g.developer, g.publisher, g.series,
        g.isHack && g.isHack !== '$undefined' ? 1 : 0,
        g.localCover ? '/' + g.localCover : '',
        g.defaultRom || '', g.ejs?.core || '', g.ejs?.biosUrl || '',
        JSON.stringify(g.tags || []), g.description || '',
        JSON.stringify(g.translations || {}),
        JSON.stringify(g.localRoms || []),
        now, now
      )
      count++
      if (count % 200 === 0) process.stdout.write(`\r[import] ${count}/${targetFiles.length}`)
    } catch (e) {
      console.error(`\n[import] SKIP ${file}: ${e.message}`)
    }
  }
  process.stdout.write(`\r[import] ${count}/${targetFiles.length}\n`)
  return count
})

const count = tx()
console.log(`[import] Done. ${count} games imported.`)

// Show stats
const total = db.prepare('SELECT COUNT(*) as total FROM games').get()
console.log(`[import] Total games in local DB: ${total.total}`)
