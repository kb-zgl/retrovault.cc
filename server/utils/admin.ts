import { useKv } from './kv'
import { verifyJwt } from './jwt'
import type { JwtPayload } from './jwt'

const ADMIN_EMAILS_KEY = 'admin:emails'

export async function getAdminEmails(): Promise<string[]> {
  const kv = useKv()
  const raw = await kv.get(ADMIN_EMAILS_KEY)
  if (raw) return JSON.parse(raw)

  // First call — seed from environment variable
  const envAdmin = (typeof process !== 'undefined' && (process.env as any).ADMIN_EMAIL) as string | undefined
  if (envAdmin) {
    const normalized = envAdmin.toLowerCase().trim()
    await kv.put(ADMIN_EMAILS_KEY, JSON.stringify([normalized]))
    return [normalized]
  }

  return []
}

export async function isAdmin(email: string): Promise<boolean> {
  const normalized = email.toLowerCase().trim()
	console.info('[admin] checking admin:', normalized)
  // Always check env var directly as fallback (works even without KV)
  const envAdmin = (typeof process !== 'undefined' && (process.env as any).ADMIN_EMAIL) as string | undefined
	console.info('[admin] checking env admin:', envAdmin)
  if (envAdmin && envAdmin.toLowerCase().trim() === normalized) {
    return true
  }

  // Also check KV whitelist
  const admins = await getAdminEmails()
  return admins.includes(normalized)
}

export async function addAdmin(email: string): Promise<void> {
  const kv = useKv()
  const admins = await getAdminEmails()
  const normalized = email.toLowerCase().trim()
  if (!admins.includes(normalized)) {
    admins.push(normalized)
    await kv.put(ADMIN_EMAILS_KEY, JSON.stringify(admins))
  }
}

export async function removeAdmin(email: string): Promise<void> {
  const kv = useKv()
  const normalized = email.toLowerCase().trim()
  const admins = (await getAdminEmails()).filter(e => e !== normalized)
  await kv.put(ADMIN_EMAILS_KEY, JSON.stringify(admins))
}

/** Require valid admin JWT from Authorization header. Returns payload on success, throws 401/403 on failure. */
export async function requireAdmin(event: any): Promise<JwtPayload> {
  const auth = getHeader(event, 'authorization')
  if (!auth || !auth.startsWith('Bearer ')) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  let payload: JwtPayload
  try {
    payload = await verifyJwt(auth.slice(7))
  } catch {
    throw createError({ statusCode: 401, statusMessage: 'Invalid or expired token' })
  }

  if (!(await isAdmin(payload.email))) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden: admin access required' })
  }

  return payload
}
