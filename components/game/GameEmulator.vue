<template>
  <Teleport to="body">
    <div v-if="visible" class="emulator-overlay">
      <!-- Top bar -->
      <div class="emulator-bar">
        <span class="emulator-bar-title">🕹️ {{ game?.title || 'Loading...' }}</span>
        <button class="emulator-bar-close" @click="close">✕</button>
      </div>

      <!-- Loading state -->
      <div v-if="loading" class="emulator-loading">
        <div class="emulator-loading-spinner"></div>
        <span>Loading emulator...</span>
      </div>

      <!-- EJS container -->
      <div ref="containerRef" class="emulator-zone" />
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

const containerRef = ref<HTMLElement | null>(null)
const loading = ref(true)
let ejsScript: HTMLScriptElement | null = null

// Expose closeGame for parent to call
function close() {
  // Cleanup EJS
  if (ejsScript && document.body.contains(ejsScript)) {
    document.body.removeChild(ejsScript)
    ejsScript = null
  }
  // Empties the EJS container (removes EJS-generated DOM)
  if (containerRef.value) {
    containerRef.value.innerHTML = ''
  }
  // Remove global EJS vars
  ;['EJS_player', 'EJS_core', 'EJS_gameUrl', 'EJS_biosUrl', 'EJS_pathtodata', 'EJS_gameName'].forEach(k => {
    delete (window as any)[k]
  })
  emit('close')
}

watch(() => props.visible, (val) => {
  if (val && props.game) {
    initEmulator()
  }
})

// Initialization if visible on mount
onMounted(() => {
  if (props.visible && props.game) {
    initEmulator()
  }
})

onUnmounted(() => {
  close()
})

function initEmulator() {
  if (!containerRef.value || !props.game) return

  loading.value = true

  // Set EJS globals (read by loader.js on load)
  const containerId = 'emulator-zone-' + Date.now()
  containerRef.value.id = containerId
  ;(window as any).EJS_player = `#${containerId}`
  ;(window as any).EJS_core = props.game.ejs.core
  ;(window as any).EJS_gameUrl = '/' + props.game.defaultRom
  ;(window as any).EJS_biosUrl = props.game.ejs.biosUrl || ''
  ;(window as any).EJS_pathtodata = 'https://cdn.emulatorjs.org/stable/data/'
  ;(window as any).EJS_gameName = props.game.title

  // Remove existing script if any
  const old = document.getElementById('ejs-loader')
  if (old) document.body.removeChild(old)

  // Load EJS dynamically
  const script = document.createElement('script')
  script.id = 'ejs-loader'
  script.src = 'https://cdn.emulatorjs.org/stable/data/loader.js'
  script.async = true
  script.onload = () => {
    loading.value = false
  }
  script.onerror = () => {
    loading.value = false
    console.error('Failed to load EmulatorJS')
  }
  document.body.appendChild(script)
  ejsScript = script
}

defineExpose({ close })
</script>

<style scoped>
.emulator-overlay {
  position: fixed;
  inset: 0;
  z-index: 5000;
  background: var(--color-bg-base);
  display: flex;
  flex-direction: column;
}

.emulator-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  padding: 0 16px;
  background: var(--color-bg-elevated);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.emulator-bar-title {
  font-family: var(--font-pixel);
  font-size: clamp(0.5rem, 1.6vw, 0.65rem);
  color: var(--color-text-primary);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.emulator-bar-close {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-accent);
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-family: var(--font-body);
}
.emulator-bar-close:hover {
  background: rgba(224, 45, 122, 0.15);
  border-color: var(--color-accent);
}

.emulator-loading {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--color-text-muted);
}

.emulator-loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: ejs-spin 0.8s linear infinite;
}

@keyframes ejs-spin {
  to { transform: rotate(360deg); }
}

.emulator-zone {
  flex: 1;
  position: relative;
  overflow: hidden;
}

/* EJS overrides */
.emulator-zone :deep(.ejs_emulator_wrapper) {
  width: 100% !important;
  height: 100% !important;
}

.emulator-zone :deep(canvas) {
  max-width: 100%;
  max-height: 100%;
}
</style>
