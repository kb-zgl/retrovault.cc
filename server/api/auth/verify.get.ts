export default defineEventHandler(async (event) => {
  const { token } = getQuery(event)
  if (!token || typeof token !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'Missing token' })
  }

  const kv = useKv()
  const stored = await kv.get(`magic_link:${token}`)

  if (!stored) {
    // Token expired or invalid — show a friendly error page
    setHeader(event, 'Content-Type', 'text/html')
    return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Link Expired — RetroVault</title>
<style>
body{background:#0d0b12;color:#ede8f5;font-family:Inter,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;text-align:center;padding:20px}
.card{background:#1a1722;border:1px solid #2e2a38;border-radius:24px;padding:40px;max-width:400px}
h1{font-size:1.2rem;margin-bottom:8px}
p{color:#9e97ad;font-size:0.85rem;line-height:1.6}
a{color:#e02d7a;text-decoration:none}
</style>
</head>
<body>
<div class="card">
<h1>🔗 Link Expired</h1>
<p>This sign-in link has expired or already been used.<br>Please request a new one.</p>
<p><a href="/">← Back to RetroVault</a></p>
</div>
</body>
</html>`
  }

  const { email } = JSON.parse(stored)
  if (!email) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid token data' })
  }

  // Delete token immediately (one-time use)
  await kv.delete(`magic_link:${token}`)

  // Find or create user
  const userKey = `user:${email}`
  let userData = await kv.get(userKey)

  if (!userData) {
    // New user — create
    const newUser = {
      id: crypto.randomUUID(),
      email,
      username: email.split('@')[0],
      avatarUrl: null as string | null,
      createdAt: Date.now(),
    }
    await kv.put(userKey, JSON.stringify(newUser))
    userData = JSON.stringify(newUser)
  }

  const user = JSON.parse(userData)

  // Sign JWT
  const jwt = await signJwt({ sub: user.id, email: user.email, username: user.username })

  // Return HTML that saves JWT and redirects
  setHeader(event, 'Content-Type', 'text/html')
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Signing in… — RetroVault</title>
<style>
body{background:#0d0b12;color:#ede8f5;font-family:Inter,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:20px;text-align:center}
p{color:#9e97ad;font-size:0.9rem}
.spinner{width:24px;height:24px;border:3px solid #2e2a38;border-top-color:#e02d7a;border-radius:50%;animation:spin .8s linear infinite;margin:0 auto 16px}
@keyframes spin{to{transform:rotate(360deg)}}
</style>
</head>
<body>
<div>
<div class="spinner"></div>
<p>Signing you in…</p>
</div>
<script>
try { localStorage.setItem('app-token', '${jwt}') } catch(e) {}
window.location.href = '/'
</script>
</body>
</html>`
})
