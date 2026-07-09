import { defineEventHandler, getQuery } from 'h3'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const { platform, genre, page: pageStr = '1', limit: limitStr = '48' } = query
  const tag = query.tag as string | undefined
  const year = query.year as string | undefined
  const q = query.q as string | undefined

  let where = '1=1'
  const params: any[] = []

  // Full-text search via LIKE
  if (q && q.trim()) {
    const term = `%${q.trim()}%`
    where += ' AND (title LIKE ? OR description LIKE ? OR tags LIKE ?)'
    params.push(term, term, term)
  }

  if (platform) {
    where += ' AND platform = ?'
    params.push(platform)
  }

  if (genre) {
    where += ' AND genre = ?'
    params.push(genre)
  }

  if (year) {
    const yearNum = parseInt(year)
    if (!isNaN(yearNum)) {
      where += ' AND year = ?'
      params.push(yearNum)
    } else if (year.endsWith('0s')) {
      const decade = parseInt(year) || parseInt(year.slice(0, -1))
      if (!isNaN(decade)) {
        where += ' AND year >= ? AND year < ?'
        params.push(decade, decade + 10)
      }
    }
  }

  // Tag filter: query all games, filter by tag on the fly
  let tagSlugs: string[] | null = null
  if (tag) {
    const allGames = await sqlAll<any>(event, 'SELECT slug, tags FROM games')
    const targetTag = tag.toLowerCase()
    tagSlugs = allGames
      .filter((g: any) => {
        try {
          const tags = typeof g.tags === 'string' ? JSON.parse(g.tags) : (g.tags || [])
          return tags.some((t: string) => t.toLowerCase() === targetTag)
        } catch { return false }
      })
      .map((g: any) => g.slug)
    if (tagSlugs.length === 0) tagSlugs = ['__none__']
    const placeholders = tagSlugs.map(() => '?').join(',')
    where += ` AND slug IN (${placeholders})`
    params.push(...tagSlugs)
  }

  const pageNum = Math.max(1, parseInt(pageStr) || 1)
  const limitNum = Math.min(200, Math.max(1, parseInt(limitStr) || 48))
  const offset = (pageNum - 1) * limitNum

  const games = await sqlAll<any>(event,
    `SELECT slug, title, platform, year, genre, series, coverUrl as coverImg, description, isHack, langs
     FROM games WHERE ${where} ORDER BY title ASC LIMIT ? OFFSET ?`,
    ...params, limitNum, offset
  )

  const [{ total }] = await sqlAll<any>(event,
    `SELECT COUNT(*) as total FROM games WHERE ${where}`,
    ...params
  )

  // Get filter options
  const platformRows = await sqlAll<any>(event, 'SELECT DISTINCT platform FROM games ORDER BY platform')
  const genreRows = await sqlAll<any>(event, 'SELECT DISTINCT genre FROM games WHERE genre IS NOT NULL AND genre != "" ORDER BY genre')

  return {
    total: total,
    totalAll: total,
    page: pageNum,
    limit: limitNum,
    hasMore: offset + limitNum < total,
    platforms: platformRows.map((r: any) => r.platform),
    genres: genreRows.map((r: any) => r.genre),
    games: games.map((g: any) => ({
      ...g,
      coverImg: g.coverImg || `/covers/${g.slug}.webp`,
      isHack: g.isHack ? 'true' : '$undefined',
      langs: typeof g.langs === 'string' ? JSON.parse(g.langs) : (g.langs || {}),
    })),
  }
})
