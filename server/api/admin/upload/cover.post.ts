import { requireAdmin } from '../../../utils/admin'
import { useD1 } from '../../../utils/d1'
import { getEnv } from '../../../utils/env'

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

  // Try R2 via env bindings
  let bucket: any
  try {
    const env = getEnv(event)
    bucket = env.CDN
  } catch {
    // No CF — fall through
  }

  if (bucket) {
    await bucket.put(key, buffer, {
      httpMetadata: { contentType: file.type || `image/${ext}` },
    })
    // Update game record with R2 path
    const db = useD1()
    const baseUrl = (getEnv(event).R2_PUBLIC_URL || '').replace(/\/+$/, '')
    const coverUrl = baseUrl ? `${baseUrl}/${key}` : `/${key}`
    await db.prepare('UPDATE games SET coverUrl = ?, updatedAt = ? WHERE slug = ?')
      .bind(coverUrl, new Date().toISOString(), slug)
      .run()
    return { success: true, coverUrl }
  }

  // No R2 — local filesystem fallback
  const { writeFile, mkdir } = await import('node:fs/promises')
  const { join } = await import('node:path')
  const uploadDir = join(process.cwd(), 'public', '_uploads')
  await mkdir(uploadDir, { recursive: true })
  const safeKey = key.replace(/[^a-zA-Z0-9/._-]/g, '')
  await writeFile(join(uploadDir, safeKey), Buffer.from(await file.arrayBuffer()))
  const coverUrl = `/_uploads/${safeKey}`

  // Update game record with local URL
  const db = useD1()
  await db.prepare('UPDATE games SET coverUrl = ?, updatedAt = ? WHERE slug = ?')
    .bind(coverUrl, new Date().toISOString(), slug)
    .run()

  return { success: true, coverUrl }
})
