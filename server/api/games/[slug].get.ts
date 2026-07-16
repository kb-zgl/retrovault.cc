import { defineEventHandler, getRouterParam, getQuery, createError } from 'h3'

import platforms from '../../../data/platforms.json' with { type: 'json' }
import genres from '../../../data/genres.json' with { type: 'json' }
import developers from '../../../data/developers.json' with { type: 'json' }
import publishers from '../../../data/publishers.json' with { type: 'json' }
import series from '../../../data/series.json' with { type: 'json' }

function taxName(tax: Record<string, Record<string, string>>, key: string, locale: string): string {
  if (!key) return ''
  return tax[locale]?.[key] || tax['en']?.[key] || key
}

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: 'Missing slug' })
  }

  const path = event.path || event.req?.url || ''
  const locale = path.startsWith('/zh') ? 'zh-CN' : 'en'

  const config = useRuntimeConfig(event)
  const r2Url = config.r2PublicUrl?.replace(/\/+$/, '') || 'https://cdn.retrovault.online'

  const game = await sqlOne<any>(event, 'SELECT * FROM games WHERE slug = ?', slug)
  if (!game) {
    throw createError({ statusCode: 404, statusMessage: `Game "${slug}" not found` })
  }

  // Parse JSON string fields
  if (typeof game.tags === 'string') game.tags = JSON.parse(game.tags)
  if (typeof game.langs === 'string') game.langs = JSON.parse(game.langs)
  if (typeof game.roms === 'string') game.roms = JSON.parse(game.roms)

  // Taxonomy key → display name
  game.platformName = taxName(platforms, game.platform, locale)
  game.genreName = taxName(genres, game.genre, locale)
  game.developerName = taxName(developers, game.developer, locale)
  game.publisherName = taxName(publishers, game.publisher, locale)
  game.seriesName = taxName(series, game.series, locale)

  // R2 public URLs
  if (game.defaultRom) game.defaultRom = `${r2Url}/${game.defaultRom}`
  if (game.coverUrl) game.localCover = `${r2Url}/${game.coverUrl}`
  else game.localCover = `${r2Url}/${game.slug}/${game.slug}.webp`

  // ROM version list → full R2 URLs
  if (Array.isArray(game.roms)) {
    game.localRoms = game.roms.map((r: any) => ({
      ...r,
      path: r.path ? `${r2Url}/${r.path}` : null,
    }))
  } else {
    game.localRoms = []
  }

  // EmulatorJS config
  game.ejs = {
    core: game.ejsCore || '',
    biosUrl: game.ejsBiosUrl || '',
    gameUrl: game.defaultRom,
  }

  // Store raw tags before deleting for related scoring
  const rawTags: string[] = Array.isArray(game.tags) ? game.tags.filter((t: any) => typeof t === 'string') : []

  // Remove internal fields
  delete game.coverUrl
  delete game.ejsCore
  delete game.ejsBiosUrl
  delete game.roms
  delete game.status
  delete game.source
  delete game.createdAt
  delete game.updatedAt

  // ── Related games (?related=true) ──────────────────────────
  const query = getQuery(event)
  if (query.related === 'true') {
    // Build parameterised query — at minimum exclude self
    const relatedParams: any[] = [slug]
    const relatedClauses: string[] = ['slug != ?']
    if (game.genre) { relatedClauses.push('genre = ?'); relatedParams.push(game.genre) }
    if (game.platform) { relatedClauses.push('platform = ?'); relatedParams.push(game.platform) }
    if (game.series) { relatedClauses.push('series = ?'); relatedParams.push(game.series) }

    const candidates = await sqlAll<any>(event,
      `SELECT slug, title, platform, genre, year, series, coverUrl, description, tags, isHack FROM games WHERE ${relatedClauses.join(' OR ')} LIMIT 60`,
      ...relatedParams
    )

    // Weighted scoring
    function relatedScore(c: any): number {
      let s = 0
      if (game.series && c.series === game.series) s += 100
      if (c.genre === game.genre && c.platform === game.platform) s += 50
      else if (c.genre === game.genre) s += 30
      else if (c.platform === game.platform) s += 20
      // Tag overlap
      if (rawTags.length) {
        const cTags: string[] = typeof c.tags === 'string'
          ? JSON.parse(c.tags).filter((t: any) => typeof t === 'string')
          : Array.isArray(c.tags) ? c.tags.filter((t: any) => typeof t === 'string') : []
        s += cTags.filter((t: string) => rawTags.includes(t)).length * 5
      }
      // Year proximity
      const yearDiff = Math.abs(c.year - game.year)
      if (yearDiff < 5) s += 3
      return s
    }

    game.related = candidates
      .map((c: any) => ({ ...c, score: relatedScore(c) }))
      .filter((c: any) => c.score > 0)
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, 8)
      .map((c: any) => ({
        slug: c.slug,
        title: c.title,
        platform: c.platform,
        genre: c.genre,
        year: c.year,
        series: c.series,
        description: c.description,
        coverImg: c.coverUrl ? `${r2Url}/${c.coverUrl}` : `${r2Url}/${c.slug}/${c.slug}.webp`,
        isHack: c.isHack ? 'true' : '$undefined',
      }))
  }

  return game
})
