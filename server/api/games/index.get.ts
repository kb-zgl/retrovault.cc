import { defineEventHandler, getQuery } from 'h3'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

interface ListQuery {
  platform?: string
  genre?: string
  year?: string
  tag?: string
  page?: string
  limit?: string
}

// 标签→slug 映射缓存
let tagSlugCache: Record<string, string[]> | null = null

function getTagSlugs(targetTag: string): string[] {
  if (!tagSlugCache) {
    tagSlugCache = {}
    const gamesDir = join(process.cwd(), 'retrovault-scraper', 'data', 'games')
    const { readdirSync } = require('node:fs')
    const entries = readdirSync(gamesDir, { withFileTypes: true })
    for (const entry of entries) {
      if (!entry.name.endsWith('.json')) continue
      try {
        const raw = readFileSync(join(gamesDir, entry.name), 'utf-8')
        const game = JSON.parse(raw)
        if (Array.isArray(game.tags) && game.slug) {
          for (const t of game.tags) {
            const tag = String(t).trim().toLowerCase()
            if (!tagSlugCache[tag]) tagSlugCache[tag] = []
            tagSlugCache[tag].push(game.slug)
          }
        }
      } catch { /* skip */ }
    }
  }
  return tagSlugCache[targetTag.toLowerCase()] || []
}

export default defineEventHandler((event) => {
  const { games, total, platforms, genres } = loadGameList()

  const query = getQuery(event) as ListQuery
  const { platform, genre, page = '1', limit = '48' } = query

  let filtered = Object.values(games)

  if (platform) {
    filtered = filtered.filter(g => g.platform.toLowerCase() === platform.toLowerCase())
  }

  if (genre) {
    filtered = filtered.filter(g => g.genre.toLowerCase() === genre.toLowerCase())
  }

  if (query.year) {
    const yearNum = parseInt(query.year)
    if (!isNaN(yearNum)) {
      filtered = filtered.filter(g => g.year === yearNum)
    } else if (query.year.endsWith('0s')) {
      const decade = parseInt(query.year) || parseInt(query.year.slice(0, -1))
      if (!isNaN(decade)) {
        filtered = filtered.filter(g => g.year >= decade && g.year < decade + 10)
      }
    }
  }

  if (query.tag) {
    const tagSlugs = getTagSlugs(query.tag)
    const slugSet = new Set(tagSlugs)
    filtered = filtered.filter(g => slugSet.has(g.slug))
  }

  const pageNum = Math.max(1, parseInt(page) || 1)
  const limitNum = Math.min(200, Math.max(1, parseInt(limit) || 48))
  const start = (pageNum - 1) * limitNum
  const paged = filtered.slice(start, start + limitNum)

  return {
    total: filtered.length,
    totalAll: total,
    page: pageNum,
    limit: limitNum,
    hasMore: start + limitNum < filtered.length,
    platforms,
    genres,
    games: paged,
  }
})
