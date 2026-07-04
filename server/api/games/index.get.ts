import { defineEventHandler, getQuery } from 'h3'

interface ListQuery {
  platform?: string
  genre?: string
  year?: string
  page?: string
  limit?: string
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
      // Exact year: "1990" → match 1990
      filtered = filtered.filter(g => g.year === yearNum)
    } else if (query.year.endsWith('0s')) {
      // Decade filter: "1990s" → 1990–1999
      const decade = parseInt(query.year) || parseInt(query.year.slice(0, -1))
      if (!isNaN(decade)) {
        filtered = filtered.filter(g => g.year >= decade && g.year < decade + 10)
      }
    }
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
