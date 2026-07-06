import { defineEventHandler, getRouterParam, createError } from 'h3'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: 'Missing slug' })
  }

  const game = await sqlOne<any>(event, 'SELECT * FROM games WHERE slug = ?', slug)
  if (!game) {
    throw createError({ statusCode: 404, statusMessage: `Game "${slug}" not found` })
  }

  // Parse JSON string fields
  if (typeof game.tags === 'string') game.tags = JSON.parse(game.tags)
  if (typeof game.langs === 'string') game.langs = JSON.parse(game.langs)
  if (typeof game.roms === 'string') game.roms = JSON.parse(game.roms)

  // Map fields for frontend compatibility
  game.localCover = game.coverUrl?.startsWith('covers/')
    ? game.coverUrl
    : `covers/${game.slug}.webp`
  game.imageUrl = game.imageUrl || ''
  // EmulatorJS expects game.ejs.core / game.ejs.biosUrl
  game.ejs = {
    core: game.ejsCore || '',
    biosUrl: game.ejsBiosUrl || '',
  }

  // Remove D1-only fields not needed by frontend
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
