import { requireAdmin } from '../../../utils/admin'
import { useD1 } from '../../../utils/d1'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const { slug } = getRouterParams(event)
  const body = await readBody(event)

  const now = new Date().toISOString()
  const db = useD1(event)

  // Only allowlisted fields can be updated
  const allowed = ['title', 'platform', 'year', 'genre', 'developer', 'publisher', 'series',
    'isHack', 'coverUrl', 'defaultRom', 'ejsCore', 'ejsBiosUrl', 'tags', 'description', 'langs', 'roms', 'status', 'source']

  const updates: string[] = []
  const values: any[] = []

  for (const key of allowed) {
    if (body[key] !== undefined) {
      updates.push(`${key} = ?`)
      values.push(typeof body[key] === 'object' ? JSON.stringify(body[key]) : body[key])
    }
  }

  if (updates.length === 0) throw createError({ statusCode: 400, statusMessage: 'No valid fields to update' })

  updates.push('updatedAt = ?')
  values.push(now)
  values.push(slug)

  const stmt = db.prepare(`UPDATE games SET ${updates.join(', ')} WHERE slug = ?`)
  await stmt.bind(...values).run()

  return { success: true, slug }
})
