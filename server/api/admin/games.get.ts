import { requireAdmin } from '../../utils/admin'
import { sqlAll } from '../../utils/d1'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const query = getQuery(event)

  let where = '1=1'
  const params: any[] = []

  if (query.platform) { where += ' AND platform = ?'; params.push(query.platform) }
  if (query.status) { where += ' AND status = ?'; params.push(query.status) }
  if (query.search) { where += ' AND (title LIKE ? OR slug LIKE ?)'; params.push(`%${query.search}%`, `%${query.search}%`) }

  const page = Math.max(1, parseInt(query.page as string) || 1)
  const limit = Math.min(200, Math.max(1, parseInt(query.limit as string) || 48))
  const offset = (page - 1) * limit

  const games = await sqlAll(event,
    `SELECT slug, title, platform, year, genre, status, coverUrl, source, langs FROM games WHERE ${where} ORDER BY updatedAt DESC LIMIT ? OFFSET ?`,
    ...params, limit, offset
  )
  const [{ total }] = await sqlAll(event, `SELECT COUNT(*) as total FROM games WHERE ${where}`, ...params)

  // Get filter options from D1
  const platformRows = await sqlAll(event, 'SELECT DISTINCT platform FROM games ORDER BY platform')
  const genreRows = await sqlAll(event, 'SELECT DISTINCT genre FROM games WHERE genre IS NOT NULL AND genre != "" ORDER BY genre')

  return {
    total: total,
    page,
    limit,
    games,
    filters: {
      platforms: platformRows.map(r => r.platform),
      genres: genreRows.map(r => r.genre),
      statuses: ['draft', 'published'],
    }
  }
})
