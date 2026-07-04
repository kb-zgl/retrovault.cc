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
      <div id="ejs-zone" ref="containerRef" class="emulator-zone" />
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

function initEmulator() {
  if (!props.game) return
  loading.value = true

  // Clean previous EJS instance
  cleanupEJS()

  // Set EJS globals
  window.EJS_player = '#ejs-zone'
  window.EJS_core = props.game.ejs.core
  window.EJS_gameUrl = '/' + props.game.defaultRom
  window.EJS_biosUrl = props.game.ejs.biosUrl || ''
  window.EJS_pathtodata = 'https://cdn.emulatorjs.org/stable/data/'
  window.EJS_gameName = props.game.title
  window.EJS_startOnLoaded = true // start game automatically
  window.EJS_fullscreenOnLoaded = false
  window.EJS_ready = () => {
    loading.value = false
  }

  // Load EJS script synchronously
  const existing = document.getElementById('ejs-loader')
  if (existing) existing.remove()

  const script = document.createElement('script')
  script.id = 'ejs-loader'
  script.src = 'https://cdn.emulatorjs.org/stable/data/loader.js'
  document.body.appendChild(script)
  loading.value = false
}

function cleanupEJS() {
  // Remove script
  const script = document.getElementById('ejs-loader')
  if (script) script.remove()

  // Clear container
  if (containerRef.value) {
    containerRef.value.innerHTML = ''
  }

  // Remove globals
  const keys = [
    'EJS_player', 'EJS_core', 'EJS_gameUrl', 'EJS_biosUrl',
    'EJS_pathtodata', 'EJS_gameName', 'EJS_startOnLoaded',
    'EJS_fullscreenOnLoaded', 'EJS_ready', 'EJS_emulator',
    'EJS_adBlocked',
  ]
  keys.forEach(k => { delete (window as any)[k] })
}

function close() {
  // Destroy EJS instance
  const emu = (window as any).EJS_emulator
  if (emu && typeof emu.destroy === 'function') {
    emu.destroy()
  }
  cleanupEJS()
  emit('close')
}

watch(() => props.visible, (val) => {
  if (val) initEmulator()
  else close()
})

onMounted(() => {
  if (props.visible) initEmulator()
})

onUnmounted(() => {
  cleanupEJS()
})
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
@keyframes ejs-spin { to { transform: rotate(360deg); } }
.emulator-zone {
  flex: 1;
  position: relative;
  overflow: hidden;
}
.emulator-zone :deep(.ejs_emulator_wrapper) {
  width: 100% !important;
  height: 100% !important;
}
</style>
