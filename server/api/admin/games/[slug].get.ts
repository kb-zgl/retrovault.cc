import { requireAdmin } from '../../../utils/admin'
import { sqlOne } from '../../../utils/d1'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const { slug } = getRouterParams(event)
  const game = await sqlOne('SELECT * FROM games WHERE slug = ?', slug)
  if (!game) throw createError({ statusCode: 404, statusMessage: 'Game not found' })

  // Parse JSON string fields
  if (typeof game.tags === 'string') game.tags = JSON.parse(game.tags)
  if (typeof game.langs === 'string') game.langs = JSON.parse(game.langs)
  if (typeof game.roms === 'string') game.roms = JSON.parse(game.roms)

  return game
})
