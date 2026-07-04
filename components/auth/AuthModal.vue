<template>
  <Teleport to="body">
    <div class="auth-overlay" :class="{ active: visible }" @click.self="onOverlayClick">
      <div class="auth-modal" @click.stop>
        <button class="auth-close" @click="$emit('close')">✕</button>

        <!-- Header -->
        <div class="auth-header">
          <span class="auth-icon">🎮</span>
          <h3>Sign in to RetroVault</h3>
        </div>

        <!-- Email input -->
        <div v-if="step === 'email'" class="auth-body">
          <p class="auth-desc">Enter your email to receive a sign-in link.</p>

          <div class="auth-input-wrap">
            <input
              v-model="email"
              type="email"
              placeholder="you@example.com"
              class="auth-input"
              :disabled="sending"
              @keyup.enter="sendMagicLink"
            />
          </div>

          <p v-if="errorMsg" class="auth-error">{{ errorMsg }}</p>

          <button class="auth-btn" :disabled="sending || !email.trim()" @click="sendMagicLink">
            <span v-if="sending" class="auth-spinner"></span>
            {{ sending ? 'Sending…' : 'Send Magic Link' }}
          </button>
        </div>

        <!-- Sent -->
        <div v-else class="auth-body">
          <div class="auth-sent-icon">✉️</div>
          <p class="auth-sent-text">
            Link sent to<br />
            <strong>{{ email }}</strong>
          </p>
          <p class="auth-sent-hint">Check your inbox. No email? Check spam.</p>
          <button class="auth-btn auth-btn-ghost" @click="step = 'email'">
            ← Use a different email
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const { post } = useApi()

const step = ref<'email' | 'sent'>('email')
const email = ref('')
const sending = ref(false)
const errorMsg = ref('')

async function sendMagicLink() {
  const addr = email.value.trim()
  if (!addr || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addr)) {
    errorMsg.value = 'Please enter a valid email address.'
    return
  }

  sending.value = true
  errorMsg.value = ''

  try {
    await post('/api/auth/magic-link', { email: addr })
    step.value = 'sent'
  } catch (e: any) {
    errorMsg.value = e?.data?.statusMessage || e?.message || 'Something went wrong. Try again.'
  } finally {
    sending.value = false
  }
}

function onOverlayClick() {
  if (step.value === 'sent') {
    // Don't close when in sent state — user might miss the notification
    return
  }
  emit('close')
}

// Reset on open
watch(() => step.value, () => { errorMsg.value = '' })
</script>

<style scoped>
.auth-overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(13, 11, 18, 0.9);
  z-index: 10000;
  justify-content: center;
  align-items: center;
  animation: fadeIn 0.15s ease;
}
.auth-overlay.active {
  display: flex;
}

.auth-modal {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 32px 24px 24px;
  max-width: 380px;
  width: 92%;
  position: relative;
  box-shadow: var(--shadow-modal);
}

.auth-close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 32px;
  height: 32px;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: 50%;
  color: var(--color-text-muted);
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.12s;
}
.auth-close:hover {
  border-color: var(--color-accent);
  color: var(--color-text-primary);
}

.auth-header {
  text-align: center;
  margin-bottom: 20px;
}
.auth-icon {
  font-size: 32px;
  display: block;
  margin-bottom: 8px;
}
.auth-header h3 {
  font-family: var(--font-pixel);
  font-size: clamp(0.6rem, 2.5vw, 0.75rem);
  color: var(--color-text-primary);
  margin: 0;
}

.auth-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.auth-desc {
  font-family: var(--font-body);
  font-size: clamp(0.6rem, 1.5vw, 0.7rem);
  color: var(--color-text-secondary);
  text-align: center;
  margin: 0;
  letter-spacing: 0;
}

.auth-input-wrap {
  width: 100%;
}
.auth-input {
  width: 100%;
  height: 44px;
  padding: 0 14px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-primary);
  font-family: var(--font-body);
  font-size: clamp(0.7rem, 1.8vw, 0.85rem);
  outline: none;
  transition: border-color 0.15s;
  box-sizing: border-box;
  letter-spacing: 0;
}
.auth-input:focus {
  border-color: var(--color-accent);
}
.auth-input:disabled {
  opacity: 0.5;
}
.auth-input::placeholder {
  color: var(--color-text-muted);
}

.auth-error {
  font-family: var(--font-body);
  font-size: clamp(0.55rem, 1.3vw, 0.65rem);
  color: var(--color-danger);
  margin: 0;
  text-align: center;
  letter-spacing: 0;
}

.auth-btn {
  width: 100%;
  height: 44px;
  font-family: var(--font-pixel);
  font-size: clamp(0.48rem, 1.4vw, 0.58rem);
  background: var(--color-accent);
  color: #fff;
  border: none;
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all 0.12s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.auth-btn:hover:not(:disabled) {
  opacity: 0.85;
}
.auth-btn:active:not(:disabled) {
  transform: scale(0.97);
}
.auth-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.auth-btn-ghost {
  background: transparent;
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
  height: 40px;
  font-size: clamp(0.42rem, 1.2vw, 0.52rem);
}
.auth-btn-ghost:hover {
  border-color: var(--color-accent);
  color: var(--color-text-primary);
}

.auth-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

.auth-sent-icon {
  font-size: 40px;
  text-align: center;
  margin-bottom: 4px;
}
.auth-sent-text {
  font-family: var(--font-body);
  font-size: clamp(0.65rem, 1.6vw, 0.75rem);
  color: var(--color-text-primary);
  text-align: center;
  margin: 0;
  line-height: 1.6;
  letter-spacing: 0;
}
.auth-sent-text strong {
  word-break: break-all;
}
.auth-sent-hint {
  font-family: var(--font-body);
  font-size: clamp(0.55rem, 1.3vw, 0.65rem);
  color: var(--color-text-muted);
  text-align: center;
  margin: 0;
  letter-spacing: 0;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
