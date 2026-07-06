import { createError } from 'h3'
import type { H3Event } from 'h3'

export interface CloudflareEnv {
  DB: D1Database
  CACHE: KVNamespace
  CDN: R2Bucket
  R2_PUBLIC_URL: string
  RETROVAULT_KV: KVNamespace
  JWT_SECRET: string
  SITE_URL: string
  ADMIN_EMAIL: string
  RESEND_API_KEY: string
}

export function getEnv(event: H3Event): CloudflareEnv {
  // 1. CF Workers (production): native binding via event.context
  if (event.context.cloudflare?.env) {
    return event.context.cloudflare.env as CloudflareEnv
  }

  // 2. Local dev (Nitro + wrangler): Nitro emulates bindings via event.req.runtime
  //    Requires preset: 'cloudflare_module' + wrangler installed + wrangler.toml configured
  if ((event.req as any)?.runtime?.cloudflare?.env) {
    return (event.req as any).runtime.cloudflare.env as CloudflareEnv
  }

  // 3. Fallback for pure local dev without wrangler
  //    Falls through to individual handlers that use process.env or local filesystem
  throw createError({ statusCode: 500, statusMessage: 'Cloudflare bindings not available' })
}

/** Build an absolute URL for the site. */
export function siteUrl(env: CloudflareEnv, path = '') {
  const base = env.SITE_URL || 'http://localhost:3000'
  return path ? `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}` : base
}
