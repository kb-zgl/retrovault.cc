import { defineEventHandler, getQuery } from 'h3'

interface ListQuery {
  platform?: string
  genre?: string
  page?: string
  limit?: string
}

export default defineEventHandler((event) => {
  const { games, total, platforms, genres } = loadGameList()

  const query = getQuery(event) as ListQuery
  const { platform, genre, page = '1', limit = '48' } = query

  let filtered = Object.values(games)

  // 按平台筛选
  if (platform) {
    filtered = filtered.filter(g => g.platform.toLowerCase() === platform.toLowerCase())
  }

  // 按类型筛选
  if (genre) {
    filtered = filtered.filter(g => g.genre.toLowerCase() === genre.toLowerCase())
  }

  // 分页
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
