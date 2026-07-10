import { createError, readFormData, getRequestURL } from 'h3'
import { getEnv } from '~/server/utils/env'

const MAX_SIZE = 10 * 1024 * 1024
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif']
const EXT_MAP: Record<string, string> = { png: 'png', jpeg: 'jpg', jpg: 'jpg', webp: 'webp', gif: 'gif', avif: 'avif' }

export default defineEventHandler(async (event) => {
  const formData = await readFormData(event)
  const file = formData.get('file')

  if (!file || !(file instanceof File)) {
    throw createError({ statusCode: 400, statusMessage: 'No file provided' })
  }
  if (file.size > MAX_SIZE) {
    throw createError({ statusCode: 413, statusMessage: 'File exceeds 10MB limit' })
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw createError({ statusCode: 415, statusMessage: 'Unsupported file type. Use PNG, JPEG, WebP, or GIF.' })
  }

  const mimeType = file.type.split('/')[1]!
  const ext = EXT_MAP[mimeType] || mimeType
  const key = `covers/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`

  // Try R2 bindings
  let bucket: any
  let publicUrlBase = ''
  try {
    const env = getEnv(event)
    bucket = env.CDN
    publicUrlBase = env.R2_PUBLIC_URL || ''
  } catch {
    // No CF bindings — falls through to local filesystem
  }

  if (bucket) {
    await bucket.put(key, await file.arrayBuffer(), {
      httpMetadata: { contentType: file.type },
    })
    const requestURL = getRequestURL(event)
    const isLocalhost = requestURL.hostname === 'localhost' || requestURL.hostname === '127.0.0.1'
    const url = isLocalhost
      ? `/api/files/${key}`
      : `${publicUrlBase.replace(/\/+$/, '')}/${key}`
    return { url }
  }

  // No R2 — fallback to local filesystem
  const { writeFile, mkdir } = await import('node:fs/promises')
  const { join, dirname } = await import('node:path')
  const uploadDir = join(process.cwd(), 'public', '_uploads')
  const safeKey = key.replace(/[^a-zA-Z0-9/._-]/g, '')
  const localPath = join(uploadDir, safeKey)
  await mkdir(dirname(localPath), { recursive: true })
  await writeFile(localPath, Buffer.from(await file.arrayBuffer()))
  const url = `/_uploads/${safeKey}`

  return { url }
})
