import { defineEventHandler } from 'h3'
import { sqlAll } from '../utils/d1'

export default defineEventHandler(async (event) => {
  // Query all tags from D1 (stored as JSON array string)
  const rows = await sqlAll<{ tags: string }>(event, 'SELECT tags FROM games WHERE tags IS NOT NULL AND tags != ""')

  const tagMap = new Map<string, number>()
  for (const row of rows) {
    try {
      const parsed = typeof row.tags === 'string' ? JSON.parse(row.tags) : (row.tags || [])
      if (Array.isArray(parsed)) {
        for (const t of parsed) {
          const tag = String(t).trim().toLowerCase()
          if (tag) tagMap.set(tag, (tagMap.get(tag) || 0) + 1)
        }
      }
    } catch { /* skip corrupt tags */ }
  }

  const tags = [...tagMap.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)

  return { total: tags.length, tags }
})
