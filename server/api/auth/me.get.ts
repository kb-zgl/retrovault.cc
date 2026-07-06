import { isAdmin } from '../../utils/admin'

export default defineEventHandler(async (event) => {
  const auth = getHeader(event, 'authorization')
  if (!auth || !auth.startsWith('Bearer ')) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const token = auth.slice(7)
  let payload
  try {
    payload = await verifyJwt(token)
  } catch {
    throw createError({ statusCode: 401, statusMessage: 'Invalid or expired token' })
  }

  const kv = useKv()
  const userKey = `user:${payload.email}`
  const userData = await kv.get(userKey)

  if (!userData) {
    throw createError({ statusCode: 404, statusMessage: 'User not found' })
  }

  const user = JSON.parse(userData)
  user.role = (await isAdmin(payload.email)) ? 'admin' : 'user'
  return user
})
