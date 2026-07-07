import { requireAdmin } from '../../../utils/admin'
import { useD1 } from '../../../utils/d1'
import { sqlOne } from '../../../utils/d1'
import { isValidKey } from '../../../../utils/reference-data'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const { slug } = getRouterParams(event)
  const body = await readBody(event)
  const now = new Date().toISOString()
  const db = useD1(event)

  // Allowed fields
  const allowed = ['title', 'platform', 'year', 'genre', 'developer', 'publisher', 'series',
    'isHack', 'language', 'coverUrl', 'imageUrl', 'defaultRom', 'ejsCore', 'ejsBiosUrl',
    'tags', 'description', 'langs', 'roms', 'status', 'source']

  // Reference-backed fields — warn on unrecognized keys
  const refCategories: Record<string, string> = {
    platform: 'platforms',
    genre: 'genres',
    developer: 'developers',
    publisher: 'publishers',
    series: 'series',
    tags: 'tags',
  }

  // Check if game exists
  const existing = await sqlOne(event, 'SELECT slug FROM games WHERE slug = ?', slug)
  const isNew = !existing

  if (isNew) {
    // INSERT new game
    const fields = ['slug', 'createdAt', 'updatedAt']
    const placeholders = ['?', '?', '?']
    const vals = [slug, now, now]

    for (const key of allowed) {
      if (body[key] !== undefined) {
        fields.push(key)
        placeholders.push('?')
        vals.push(typeof body[key] === 'object' ? JSON.stringify(body[key]) : body[key])
      }
    }

    // Validate reference-backed fields
    for (const [field, cat] of Object.entries(refCategories)) {
      if (body[field] !== undefined && !isValidKey(cat, body[field])) {
        console.warn(`[admin] Unrecognized ${field} key: "${body[field]}"`)
      }
    }

    await db.prepare(`INSERT INTO games (${fields.join(',')}) VALUES (${placeholders.join(',')})`).bind(...vals).run()
    return { success: true, slug, isNew: true }
  }

  // UPDATE existing game
  const updates: string[] = []
  const values: any[] = []

  for (const key of allowed) {
    if (body[key] !== undefined) {
      updates.push(`${key} = ?`)
      values.push(typeof body[key] === 'object' ? JSON.stringify(body[key]) : body[key])
    }
  }

  if (updates.length === 0) throw createError({ statusCode: 400, statusMessage: 'No valid fields to update' })

  // Validate reference-backed fields
  for (const [field, cat] of Object.entries(refCategories)) {
    if (body[field] !== undefined && !isValidKey(cat, body[field])) {
      console.warn(`[admin] Unrecognized ${field} key: "${body[field]}"`)
    }
  }

  updates.push('updatedAt = ?')
  values.push(now)
  values.push(slug)

  await db.prepare(`UPDATE games SET ${updates.join(', ')} WHERE slug = ?`).bind(...values).run()
  return { success: true, slug, isNew: false }
})
