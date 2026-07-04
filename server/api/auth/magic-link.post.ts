export default defineEventHandler(async (event) => {
  const { email } = await readBody<{ email: string }>(event)

  // Validate email
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid email address' })
  }

  const normalized = email.toLowerCase().trim()
  const token = crypto.randomUUID()
  const kv = useKv()

  // Store magic link token with 15 min TTL
  await kv.put(`magic_link:${token}`, JSON.stringify({ email: normalized, createdAt: Date.now() }), {
    expirationTtl: 900,
  })

  // Build verify URL
  const siteUrl = process.env.SITE_URL || 'http://localhost:3000'
  const verifyUrl = `${siteUrl}/api/auth/verify?token=${token}`

  // Send email via Resend
  const resendKey = process.env.RESEND_API_KEY
  if (resendKey) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'RetroVault <noreply@retrovault.cc>',
        to: normalized,
        subject: '🎮 Sign in to RetroVault',
        text: `Hi!\n\nClick the link below to sign in to RetroVault:\n\n${verifyUrl}\n\nThis link expires in 15 minutes.\n\n— RetroVault`,
      }),
    })

    if (!res.ok) {
      const errBody = await res.text()
      console.error('[auth] Resend error:', res.status, errBody)
      throw createError({ statusCode: 500, statusMessage: 'Failed to send email' })
    }
  } else {
    // Dev mode: log the link instead of sending
    console.log(`[auth] Magic link for ${normalized}: ${verifyUrl}`)
  }

  return { success: true }
})
