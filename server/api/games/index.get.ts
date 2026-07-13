import { defineEventHandler, getQuery } from 'h3'

import platforms from '../../../data/platforms.json' with { type: 'json' }
import genres from '../../../data/genres.json' with { type: 'json' }
import series from '../../../data/series.json' with { type: 'json' }

function taxName(tax: Record<string, Record<string, string>>, key: string, locale: string): string {
  if (!key) return ''
  return tax[locale]?.[key] || tax['en']?.[key] || key
}

export default defineEventHandler(async (event) => {
  const path = event.path || event.req?.url || ''
  const locale = path.startsWith('/zh') ? 'zh-CN' : 'en'

  const config = useRuntimeConfig(event)
  const r2Url = config.r2PublicUrl?.replace(/\/+$/, '') || 'https://cdn.retrovault.cc'

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

  const pageNum = Math.max(1, parseInt(String(pageStr)) || 1)
  const limitNum = Math.min(200, Math.max(1, parseInt(String(limitStr)) || 48))
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

  // Filter options from taxonomy JSON (keys for URL params, display names shown by frontend)
  const platformKeys = Object.keys(platforms.en || {}).sort()
  const genreKeys = Object.keys(genres.en || {}).sort()

  return {
    total: total,
    totalAll: total,
    page: pageNum,
    limit: limitNum,
    hasMore: offset + limitNum < total,
    platforms: platformKeys,
    genres: genreKeys,
    games: games.map((g: any) => ({
      slug: g.slug,
      title: g.title,
      platform: taxName(platforms, g.platform, locale),
      platformKey: g.platform,
      genre: taxName(genres, g.genre, locale),
      genreKey: g.genre,
      year: g.year,
      series: taxName(series, g.series, locale),
      coverImg: g.coverImg ? `${r2Url}/${g.coverImg}` : `${r2Url}/${g.slug}/${g.slug}.webp`,
      description: g.description,
      isHack: g.isHack ? 'true' : '$undefined',
      langs: typeof g.langs === 'string' ? JSON.parse(g.langs) : (g.langs || {}),
    })),
  }
})
