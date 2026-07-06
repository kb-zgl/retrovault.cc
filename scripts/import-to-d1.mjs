/**
 * Import scraper JSON data into Cloudflare D1
 *
 * Usage:
 *   node scripts/import-to-d1.mjs              # Import all games
 *   node scripts/import-to-d1.mjs --slug=mario  # Import single game
 *   node scripts/import-to-d1.mjs --limit=100   # Import first 100
 *
 * Requires: wrangler CLI, authenticated Cloudflare session
 *   wrangler d1 create retro-vault               # Create DB first
 *   wrangler d1 execute retro-vault --remote --file=scripts/init-d1.sql
 *
 * Environment:
 *   D1_DB=retro-vault   # D1 database name (default: retro-vault)
 */

import { readFileSync, readdirSync, writeFileSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'
import { execSync } from 'node:child_process'

const DATA_DIR = join(process.cwd(), 'retrovault-scraper', 'data', 'games')
const D1_DB = process.env.D1_DB || 'retro-vault'
const ARGS = new Set(process.argv.slice(2))
const SLUG = [...ARGS].find(a => a.startsWith('--slug='))?.split('=')[1]
const LIMIT = parseInt([...ARGS].find(a => a.startsWith('--limit='))?.split('=')[1] || '0')

const files = readdirSync(DATA_DIR).filter(f => f.endsWith('.json'))
let targetFiles = SLUG
  ? files.filter(f => f.startsWith(SLUG))
  : files

if (LIMIT > 0) targetFiles = targetFiles.slice(0, LIMIT)

console.log(`[import] Importing ${targetFiles.length}/${files.length} games...`)

function esc(val) {
  if (val === null || val === undefined || val === '$undefined') return 'NULL'
  return `'${String(val).replace(/'/g, "''")}'`
}

function escJson(val) {
  if (!val) return "'{}'"
  return `'${JSON.stringify(val).replace(/'/g, "''")}'`
}

let count = 0
let batch = []

for (const file of targetFiles) {
  try {
    const raw = readFileSync(join(DATA_DIR, file), 'utf-8')
    const g = JSON.parse(raw)
    const now = new Date().toISOString()

    const sql = `INSERT OR REPLACE INTO games (slug, title, platform, year, genre, developer, publisher, series, isHack, coverUrl, defaultRom, ejsCore, ejsBiosUrl, tags, description, langs, roms, status, source, createdAt, updatedAt)
    VALUES (
      ${esc(g.slug)}, ${esc(g.title)}, ${esc(g.platform)}, ${g.year || 'NULL'}, ${esc(g.genre)},
      ${esc(g.developer)}, ${esc(g.publisher)}, ${esc(g.series)},
      ${g.isHack && g.isHack !== '$undefined' ? 1 : 0},
      ${esc(g.localCover ? '/' + g.localCover : '')},
      ${esc(g.defaultRom)}, ${esc(g.ejs?.core)}, ${esc(g.ejs?.biosUrl)},
      ${escJson(g.tags)}, ${esc(g.description)},
      ${escJson(g.translations || {})},
      ${escJson(g.localRoms || [])},
      'published', 'scraped', ${esc(now)}, ${esc(now)}
    );`

    batch.push(sql)
    count++

    if (batch.length >= 50) {
      flushBatch(batch)
      batch = []
      process.stdout.write(`\r[import] ${count}/${targetFiles.length}`)
    }
  } catch (e) {
    console.error(`\n[import] SKIP ${file}: ${e.message}`)
  }
}

if (batch.length > 0) {
  flushBatch(batch)
}

process.stdout.write(`\r[import] Done. ${count}/${targetFiles.length} games imported.\n`)

function flushBatch(statements) {
  const sql = statements.join('\n')
  const tmpFile = `/tmp/d1-import-${Date.now()}.sql`
  try {
    writeFileSync(tmpFile, sql, 'utf-8')
    execSync(`npx wrangler d1 execute ${D1_DB} --file="${tmpFile}"`, {
      stdio: 'pipe',
      timeout: 60000,
    })
    unlinkSync(tmpFile)
  } catch (e) {
    console.error(`\n[import] BATCH FAILED: ${e.message}`)
  }
}
