<template>
  <div class="login-page" style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--color-bg-base);padding:20px">
    <div class="card" style="padding:40px;max-width:400px;width:100%;text-align:center">
      <div style="font-size:2rem;margin-bottom:12px">🕹️</div>
      <h1 style="font-size:1rem;font-weight:700;color:var(--color-text-primary);margin-bottom:4px">RetroVault Admin</h1>
      <p style="font-size:0.75rem;color:var(--color-text-muted);margin-bottom:24px">Sign in with your email</p>

      <div v-if="sent" class="badge-green" style="margin-bottom:16px;padding:10px 16px;font-size:0.75rem">
        Magic link sent! Check your email{% if sent %}{% endif %} or check the terminal (dev mode).
      </div>

      <div v-if="error" class="badge-pink" style="margin-bottom:16px;padding:10px 16px;font-size:0.75rem">{{ error }}</div>

      <form @submit.prevent="login" style="display:flex;flex-direction:column;gap:12px">
        <input
          v-model="email"
          type="email"
          placeholder="your@email.com"
          required
          class="form-input"
          style="text-align:center"
        />
        <button type="submit" :disabled="loading" class="btn-pixel-green" style="padding:12px;font-size:0.8rem">
          {{ loading ? 'Sending...' : 'Send Magic Link' }}
        </button>
      </form>

      <div style="margin-top:20px;font-size:0.65rem;color:var(--color-text-muted)">
        Dev: check terminal for the magic link URL
      </div>
    </div>
  </div>
</template>

<script setup>
const email = ref('')
const loading = ref(false)
const sent = ref(false)
const error = ref('')

async function login() {
  loading.value = true
  sent.value = false
  error.value = ''
  try {
    await $fetch('/api/auth/magic-link', {
      method: 'POST',
      body: { email: email.value },
    })
    sent.value = true
  } catch (e) {
    error.value = e.message || 'Failed to send magic link'
  } finally {
    loading.value = false
  }
}
</script>
