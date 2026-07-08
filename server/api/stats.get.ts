import { defineEventHandler } from 'h3'

export interface SiteStats {
  games: number
  platforms: number
}

export default defineEventHandler(async (event): Promise<SiteStats> => {
  const [{ total }] = await sqlAll<{ total: number }>(event, 'SELECT COUNT(*) as total FROM games')
  const platforms = await sqlAll<{ platform: string }>(event, 'SELECT DISTINCT platform FROM games')
  return { games: total || 0, platforms: platforms.length }
})
