/**
 * Dev-only: quick login for configured admin email.
 * GET /api/admin/dev-login
 * Generates a JWT for the ADMIN_EMAIL env var and returns it.
 * Only works when NODE_ENV is not production.
 */
export default defineEventHandler(async (event) => {
  const envAdmin = process.env.ADMIN_EMAIL
  if (!envAdmin) {
    throw createError({ statusCode: 400, statusMessage: 'ADMIN_EMAIL not configured' })
  }

  const { addAdmin } = await import('../../utils/admin')
  await addAdmin(envAdmin)

  const jwt = await signJwt({
    sub: crypto.randomUUID(),
    email: envAdmin,
    username: envAdmin.split('@')[0],
  })

  return { token: jwt, email: envAdmin }
})
