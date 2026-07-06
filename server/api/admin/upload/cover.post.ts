import { requireAdmin } from '../../../utils/admin'
import { useD1 } from '../../../utils/d1'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const { slug } = getQuery(event)
  if (!slug) throw createError({ statusCode: 400, statusMessage: 'Missing slug' })

  const formData = await readFormData(event)
  const file = formData.get('file') as File | null
  if (!file) throw createError({ statusCode: 400, statusMessage: 'No file uploaded' })

  const buffer = await file.arrayBuffer()
  const ext = file.name.split('.').pop() || 'webp'
  const key = `covers/${slug}.${ext}`

  // Upload to R2
  const r2 = (process.env as any).RETROVAULT_R2
  if (!r2) throw createError({ statusCode: 500, statusMessage: 'R2 not configured' })

  await r2.put(key, buffer, {
    httpMetadata: { contentType: file.type || `image/${ext}` },
  })

  // Update game record
  const db = useD1()
  const coverUrl = `/${key}`
  await db.prepare('UPDATE games SET coverUrl = ?, updatedAt = ? WHERE slug = ?')
    .bind(coverUrl, new Date().toISOString(), slug)
    .run()

  return { success: true, coverUrl }
})
