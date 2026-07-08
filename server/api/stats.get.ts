import { defineEventHandler } from 'h3'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const DATA_DIR = join(process.cwd(), 'retrovault-scraper', 'data')

export interface SiteStats {
  games: number
  platforms: number
}

export default defineEventHandler((): SiteStats => {
  const raw = readFileSync(join(DATA_DIR, 'all_games.json'), 'utf-8')
  const data = JSON.parse(raw)
  const platforms = data.index_summary?.platform
    ? Object.keys(data.index_summary.platform).length
    : 0
  return { games: data.total || 0, platforms }
})
