import { defineEventHandler, getRouterParam, createError } from 'h3'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

export default defineEventHandler((event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: 'Missing slug' })
  }

  const gamePath = join(DATA_DIR, 'games', `${slug}.json`)

  if (!existsSync(gamePath)) {
    throw createError({ statusCode: 404, statusMessage: `Game "${slug}" not found` })
  }

  const raw = readFileSync(gamePath, 'utf-8')
  const game = JSON.parse(raw)

  delete game._scraped_at
  delete game._source
  delete game._detail_method

  return game
})
