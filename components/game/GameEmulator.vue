<template>
  <Teleport to="body">
    <div
      class="emulator-overlay"
      :class="{ 'emulator-hidden': !visible }"
    >
      <!-- Close button (floating top-right) -->
      <button class="emulator-close-btn" @click="close" title="Close (Esc)">✕</button>

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
const ejsInited = ref(false)

// Esc key to close
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') close()
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
  // Component may mount with visible=true; watch won't fire for initial value
  if (props.visible) initEmulator()
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
  destroyEmulator()
})

// Switch to a different game → full re-init
watch(() => props.game?.slug, (newSlug, oldSlug) => {
  if (newSlug && oldSlug && newSlug !== oldSlug) {
    destroyEmulator()
    nextTick(() => initEmulator())
  }
})

// Show/hide overlay — only re-init if not yet initialized
watch(() => props.visible, (val) => {
  if (val) {
    if (!ejsInited.value) {
      initEmulator()
    }
  }
})

function initEmulator() {
  if (!props.game) return
  loading.value = true
  ejsInited.value = true

  cleanupEJS()

  const w = window as any
  w.EJS_player = '#ejs-zone'
  w.EJS_core = props.game.ejs.core
  w.EJS_gameUrl = '/' + props.game.defaultRom
  w.EJS_biosUrl = props.game.ejs.biosUrl || ''
  w.EJS_pathtodata = 'https://cdn.emulatorjs.org/stable/data/'
  w.EJS_gameName = props.game.title
  w.EJS_gameId = props.game.slug
  w.EJS_startOnLoaded = true
  w.EJS_fullscreenOnLoaded = false
  w.EJS_ready = () => {
    loading.value = false
  }

  const existing = document.getElementById('ejs-loader')
  if (existing) existing.remove()

  const script = document.createElement('script')
  script.id = 'ejs-loader'
  script.src = 'https://cdn.emulatorjs.org/stable/data/loader.js'
  document.body.appendChild(script)
}

function cleanupEJS() {
  const script = document.getElementById('ejs-loader')
  if (script) script.remove()

  if (containerRef.value) {
    containerRef.value.innerHTML = ''
  }

  const keys = [
    'EJS_player', 'EJS_core', 'EJS_gameUrl', 'EJS_biosUrl',
    'EJS_pathtodata', 'EJS_gameName', 'EJS_gameId',
    'EJS_startOnLoaded', 'EJS_fullscreenOnLoaded',
    'EJS_ready', 'EJS_emulator', 'EJS_adBlocked',
  ]
  keys.forEach(k => { delete (window as any)[k] })
}

function saveAndDestroy() {
  const emu = (window as any).EJS_emulator
  if (emu) {
    // Save state to localStorage first
    if (typeof emu.saveState === 'function') {
      try { emu.saveState() } catch { /* ignore */ }
    }
    // Destroy EJS (kills AudioContext, all audio stops)
    if (typeof emu.destroy === 'function') {
      try { emu.destroy() } catch { /* ignore */ }
    }
  }
  cleanupEJS()
  ejsInited.value = false
  loading.value = true
}

function destroyEmulator() {
  saveAndDestroy()
}

function close() {
  saveAndDestroy()
  emit('close')
}
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
.emulator-hidden {
  display: none !important;
}
.emulator-close-btn {
  position: fixed;
  top: 12px;
  right: 12px;
  z-index: 5010;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid var(--color-border);
  background: var(--color-bg-elevated);
  color: var(--color-accent);
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-body);
  box-shadow: 0 2px 12px rgba(0,0,0,0.4);
  transition: all 0.1s ease;
}
.emulator-close-btn:hover {
  background: rgba(224, 45, 122, 0.2);
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
