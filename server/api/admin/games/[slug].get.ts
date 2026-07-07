import { requireAdmin } from '../../../utils/admin'
import { sqlOne } from '../../../utils/d1'
import { lookupDisplayName } from '../../../../utils/reference-data'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const { slug } = getRouterParams(event)
  const query = getQuery(event)
  const locale = (query.locale as string) || 'zh'

  const game = await sqlOne(event, 'SELECT * FROM games WHERE slug = ?', slug)
  if (!game) throw createError({ statusCode: 404, statusMessage: 'Game not found' })

  // Parse JSON string fields
  if (typeof game.tags === 'string') game.tags = JSON.parse(game.tags)
  if (typeof game.langs === 'string') game.langs = JSON.parse(game.langs)
  if (typeof game.roms === 'string') game.roms = JSON.parse(game.roms)

  // Add display-name resolution
  game.platformDisplay = lookupDisplayName('platforms', game.platform as string, locale)
  game.genreDisplay = lookupDisplayName('genres', game.genre as string, locale)
  game.developerDisplay = lookupDisplayName('developers', game.developer as string, locale)
  game.publisherDisplay = lookupDisplayName('publishers', game.publisher as string, locale)
  game.seriesDisplay = lookupDisplayName('series', game.series as string, locale)

  return game
})
