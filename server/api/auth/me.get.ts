import { isAdmin } from '../../utils/admin'
import type { JwtPayload } from '../../utils/jwt'

export default defineEventHandler(async (event) => {
  const auth = getHeader(event, 'authorization')
  if (!auth || !auth.startsWith('Bearer ')) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const token = auth.slice(7)
  let payload: JwtPayload
  try {
    payload = await verifyJwt(token)
  } catch {
    throw createError({ statusCode: 401, statusMessage: 'Invalid or expired token' })
  }

  const role = (await isAdmin(payload.email)) ? 'admin' : 'user'

  return {
    id: payload.sub,
    email: payload.email,
    username: payload.username,
    role,
  }
})
