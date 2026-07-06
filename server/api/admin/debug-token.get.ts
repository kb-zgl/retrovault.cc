/**
 * Debug endpoint — check your JWT and admin status.
 * Visit: /api/admin/debug-token?token=YOUR_JWT
 * Or call with Authorization header.
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  // Try token from query param, then Authorization header
  let token = query.token as string | undefined
  if (!token) {
    const auth = getHeader(event, 'authorization')
    if (auth?.startsWith('Bearer ')) token = auth.slice(7)
  }

  if (!token) {
    return { status: 'no_token', message: 'Pass ?token=YOUR_JWT or Authorization: Bearer header' }
  }

  // Verify JWT
  try {
    const payload = await verifyJwt(token)
    const admin = await isAdmin(payload.email)
    return {
      status: 'ok',
      payload: {
        sub: payload.sub,
        email: payload.email,
        username: payload.username,
        iat: payload.iat ? new Date(payload.iat * 1000).toISOString() : null,
        exp: payload.exp ? new Date(payload.exp * 1000).toISOString() : null,
      },
      isAdmin: admin,
      envAdmin: process.env.ADMIN_EMAIL || '(not set)',
    }
  } catch (e: any) {
    return { status: 'error', message: e.message }
  }
})
