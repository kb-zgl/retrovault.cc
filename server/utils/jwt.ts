import { SignJWT, jwtVerify } from 'jose'

function getSecret(): Uint8Array {
  const raw = process.env.JWT_SECRET
  if (!raw) {
    // Fallback for local dev — log a warning but don't crash
    console.warn('[jwt] JWT_SECRET not set, using dev fallback')
    return new TextEncoder().encode('dev-secret-do-not-use-in-production')
  }
  return new TextEncoder().encode(raw)
}

export interface JwtPayload {
  sub: string       // user id (uuid)
  email: string
  username: string
  iat?: number
  exp?: number
}

export async function signJwt(payload: { sub: string; email: string; username: string }): Promise<string> {
  return await new SignJWT({ email: payload.email, username: payload.username })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(getSecret())
}

export async function verifyJwt(token: string): Promise<JwtPayload> {
  const { payload } = await jwtVerify(token, getSecret(), { algorithms: ['HS256'] })
  return payload as unknown as JwtPayload
}
