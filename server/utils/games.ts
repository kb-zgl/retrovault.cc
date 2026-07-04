import { defineEventHandler } from 'h3'
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

// 爬虫数据目录（相对于项目根目录）
const DATA_DIR = join(process.cwd(), 'retrovault-scraper', 'data')

export interface GameSummary {
  slug: string
  title: string
  platform: string
  year: number
  genre: string
  series: string
  coverImg: string
  description: string
  isHack: string
}

export interface GameListResponse {
  total: number
  games: Record<string, GameSummary>
  platforms: string[]
  genres: string[]
  scrapedAt: string
}

// 缓存 game_list.json（dev 下每次请求都读，未来可加缓存）
let cachedList: GameListResponse | null = null

// 标签缓存（按需加载）
let cachedTags: TagEntry[] | null = null

export interface TagEntry {
  name: string
  count: number
}

/** 提取所有标签并统计频次（惰性加载 + 缓存） */
function loadGameTags(): TagEntry[] {
  if (cachedTags) return cachedTags

  const gamesDir = join(DATA_DIR, 'games')
  const entries = readdirSync(gamesDir, { withFileTypes: true })
  const tagMap = new Map<string, number>()

  for (const entry of entries) {
    if (!entry.name.endsWith('.json')) continue
    try {
      const raw = readFileSync(join(gamesDir, entry.name), 'utf-8')
      const game = JSON.parse(raw)
      if (Array.isArray(game.tags)) {
        for (const t of game.tags) {
          const tag = String(t).trim().toLowerCase()
          if (tag) tagMap.set(tag, (tagMap.get(tag) || 0) + 1)
        }
      }
    } catch { /* skip corrupt files */ }
  }

  cachedTags = [...tagMap.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)

  return cachedTags
}

function loadGameList(): GameListResponse {
  if (cachedList) return cachedList

  const listPath = join(DATA_DIR, 'game_list.json')
  if (!existsSync(listPath)) {
    throw createError({ statusCode: 500, statusMessage: 'Game list not found' })
  }

  const raw = readFileSync(listPath, 'utf-8')
  const data = JSON.parse(raw)

  const games = data.games as Record<string, GameSummary>
  const platforms = [...new Set(Object.values(games).map((g: GameSummary) => g.platform))].sort()
  const genres = [...new Set(Object.values(games).map((g: GameSummary) => g.genre))].sort()

  cachedList = {
    total: data.total,
    games,
    platforms,
    genres,
    scrapedAt: data.scraped_at,
  }

  return cachedList
}

export { loadGameList, loadGameTags, DATA_DIR }
