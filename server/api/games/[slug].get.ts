import { defineEventHandler, getRouterParam, createError } from 'h3'

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

  // Remove internal fields
  delete game.coverUrl
  delete game.ejsCore
  delete game.ejsBiosUrl
  delete game.roms
  delete game.status
  delete game.source
  delete game.createdAt
  delete game.updatedAt

  return game
})
