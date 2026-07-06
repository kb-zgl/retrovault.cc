import { createError } from 'h3'
import { getEnv } from '~/server/utils/env'

const MAX_SIZE = 10 * 1024 * 1024
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif']
const EXT_MAP: Record<string, string> = {
  png: 'png', jpeg: 'jpg', jpg: 'jpg', webp: 'webp', gif: 'gif', avif: 'avif',
}

export default defineEventHandler(async (event) => {
  const { slug, fileType, fileSize } = await readBody(event)

  if (!slug || !fileType || fileSize == null) {
    throw createError({ statusCode: 400, statusMessage: 'Missing required fields' })
  }
  if (fileSize > MAX_SIZE) {
    throw createError({ statusCode: 413, statusMessage: 'File exceeds 10MB limit' })
  }
  if (!ALLOWED_TYPES.includes(fileType)) {
    throw createError({ statusCode: 415, statusMessage: 'Unsupported file type. Use PNG, JPEG, WebP, GIF, or AVIF.' })
  }

  const mimeType = fileType.split('/')[1]
  const ext = EXT_MAP[mimeType] || 'png'
  const key = `covers/${slug}.${ext}`

  const env = getEnv(event)
  const bucket = env.CDN
  const isProduction = !!(event.context as any)?.cloudflare?.env?.R2_PUBLIC_URL

  if (!isProduction) {
    // Local dev — client uploads via proxy
    return { mode: 'proxy', uploadUrl: '/api/upload', key }
  }

  // Production — generate presigned PUT URL for browser direct upload to R2
  try {
    const uploadUrl = await (bucket as any).createSignedUrl(key, {
      method: 'PUT',
      expiresIn: 3600,
    })
    const publicUrl = `${env.R2_PUBLIC_URL.replace(/\/+$/, '')}/${key}`
    return { mode: 'direct', uploadUrl, publicUrl, key }
  } catch {
    // Mock R2 doesn't support createSignedUrl — fall back to proxy
    return { mode: 'proxy', uploadUrl: '/api/upload', key }
  }
})
