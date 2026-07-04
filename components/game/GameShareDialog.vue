<template>
  <Teleport to="body">
    <div class="share-overlay" :class="{ active: visible }" @click.self="$emit('close')">
      <div class="share-modal" @click.stop>
        <button class="share-close" @click="$emit('close')">✕</button>

        <!-- Game info -->
        <div class="share-game-info">
          <div class="share-cover">
            <img v-if="coverOk" :src="`/${game.localCover}`" :alt="game.title" @error="coverOk = false" />
            <span v-else>🎮</span>
          </div>
          <div class="share-game-text">
            <div class="share-game-title">{{ game.title }}</div>
            <div class="share-game-meta">{{ game.platform }} · {{ game.year }}</div>
          </div>
        </div>

        <!-- Share platforms -->
        <div class="share-platforms">
          <button
            v-for="p in platforms"
            :key="p.id"
            class="share-platform-btn"
            :style="{ '--btn-color': p.color }"
            :title="p.label"
            @click="share(p)"
          >
            <span class="share-platform-icon">{{ p.icon }}</span>
            <span class="share-platform-label">{{ p.label }}</span>
          </button>
        </div>

        <!-- Copy link -->
        <button class="share-copy-btn" @click="copyLink">
          <span v-if="copied">✅ Copied!</span>
          <span v-else>📋 Copy Link</span>
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { GameData } from '~/types/games'

const props = defineProps<{
  game: GameData
  visible: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const coverOk = ref(true)

// Build share URL from current origin
const shareUrl = computed(() => {
  const base = window.location.origin
  return `${base}/games/${props.game.slug}`
})

const shareText = computed(() => {
  return `🎮 Play ${props.game.title} online free — RetroVault`
})

interface Platform {
  id: string
  label: string
  icon: string
  color: string
  url: (u: string, t: string, title: string) => string
}

const platforms: Platform[] = [
  {
    id: 'twitter',
    label: 'X',
    icon: '𝕏',
    color: '#000',
    url: (u, t) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(t)}&url=${encodeURIComponent(u)}`,
  },
  {
    id: 'facebook',
    label: 'Facebook',
    icon: 'f',
    color: '#1877F2',
    url: (u) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(u)}`,
  },
  {
    id: 'telegram',
    label: 'Telegram',
    icon: '✈',
    color: '#0088cc',
    url: (u, t) => `https://t.me/share/url?url=${encodeURIComponent(u)}&text=${encodeURIComponent(t)}`,
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    icon: '💬',
    color: '#25D366',
    url: (u, t) => `https://wa.me/?text=${encodeURIComponent(t + ' ' + u)}`,
  },
  {
    id: 'reddit',
    label: 'Reddit',
    icon: 'R',
    color: '#FF4500',
    url: (u, _, title) => `https://reddit.com/submit?url=${encodeURIComponent(u)}&title=${encodeURIComponent(title)}`,
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    icon: 'in',
    color: '#0A66C2',
    url: (u) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(u)}`,
  },
  {
    id: 'email',
    label: 'Email',
    icon: '✉',
    color: '#9e97ad',
    url: (_, t, title) => `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(t + '\n' + shareUrl.value)}`,
  },
  {
    id: 'copy',
    label: 'Copy Link',
    icon: '🔗',
    color: '#e02d7a',
    url: () => '',
  },
]

function share(p: Platform) {
  if (p.id === 'copy') {
    copyLink()
    return
  }
  const href = p.url(shareUrl.value, shareText.value, `Play ${props.game.title} Online Free — RetroVault`)
  window.open(href, '_blank', 'noopener,noreferrer,width=600,height=500')
}

const copied = ref(false)

async function copyLink() {
  try {
    await navigator.clipboard.writeText(shareUrl.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 1500)
  } catch {
    // Fallback for older browsers
    const ta = document.createElement('textarea')
    ta.value = shareUrl.value
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    copied.value = true
    setTimeout(() => { copied.value = false }, 1500)
  }
}

// Close on Escape
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.visible) {
    emit('close')
  }
}
onMounted(() => {
  document.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
})
</script>

<style scoped>
.share-overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(13, 11, 18, 0.9);
  z-index: 10000;
  justify-content: center;
  align-items: center;
  animation: fadeIn 0.15s ease;
}
.share-overlay.active {
  display: flex;
}

.share-modal {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 24px 20px 20px;
  max-width: 400px;
  width: 92%;
  position: relative;
  box-shadow: var(--shadow-modal);
}

.share-close {
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
.share-close:hover {
  border-color: var(--color-accent);
  color: var(--color-text-primary);
}

/* Game info */
.share-game-info {
  display: flex;
  gap: 14px;
  align-items: center;
  margin-bottom: 18px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--color-border);
}

.share-cover {
  width: 64px;
  aspect-ratio: 375/515;
  background: #1e1b26;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  flex-shrink: 0;
  overflow: hidden;
}
.share-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.share-game-title {
  font-family: var(--font-pixel);
  font-size: clamp(0.55rem, 2vw, 0.7rem);
  color: var(--color-text-primary);
  line-height: 1.4;
  margin-bottom: 4px;
}
.share-game-meta {
  font-family: var(--font-body);
  font-size: clamp(0.5rem, 1.3vw, 0.6rem);
  color: var(--color-text-muted);
  letter-spacing: 0;
}

/* Platform grid */
.share-platforms {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-bottom: 16px;
}

.share-platform-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 6px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.12s ease;
  min-height: 64px;
}
.share-platform-btn:hover {
  border-color: var(--color-accent);
  background: var(--color-bg-surface);
  transform: translateY(-2px);
}
.share-platform-btn:active {
  transform: scale(0.95);
}

.share-platform-icon {
  font-size: 20px;
  font-weight: 700;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  color: var(--btn-color, var(--color-text-primary));
  transition: all 0.12s;
}
.share-platform-btn:hover .share-platform-icon {
  background: var(--btn-color, var(--color-accent));
  color: #fff;
  border-color: transparent;
}

.share-platform-label {
  font-family: var(--font-body);
  font-size: 9px;
  color: var(--color-text-muted);
  letter-spacing: 0;
  font-weight: 600;
}

/* Copy link */
.share-copy-btn {
  width: 100%;
  height: 40px;
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
}
.share-copy-btn:hover {
  opacity: 0.85;
}
.share-copy-btn:active {
  transform: scale(0.97);
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
