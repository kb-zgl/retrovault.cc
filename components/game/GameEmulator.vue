<template>
  <Teleport to="body">
    <div
      class="emulator-overlay"
      :class="{ 'emulator-hidden': !visible }"
    >
      <button class="emulator-close-btn" @click="close" title="Close (Esc)">✕</button>

      <div v-if="loading" class="emulator-loading">
        <div class="emulator-loading-spinner"></div>
        <span>Loading emulator...</span>
      </div>

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
const isClosing = ref(false)
const saves = useGameSaves()

// Esc key to close
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') close()
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
  if (props.visible) initEmulator()
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
  destroyEmulator()
})

// 切换游戏 → 全量重建
watch(() => props.game?.slug, (newSlug, oldSlug) => {
  if (newSlug && oldSlug && newSlug !== oldSlug) {
    destroyEmulator()
    nextTick(() => initEmulator())
  }
})

// 显示/隐藏
watch(() => props.visible, (val) => {
  if (val) {
    if (!ejsInited.value) {
      initEmulator()
    }
  }
})

// ==================== 初始化 ====================

function initEmulator() {
  if (!props.game) return
  loading.value = true
  ejsInited.value = true
  isClosing.value = false

  cleanupEJS()

  const w = window as any
  w.EJS_player = '#ejs-zone'
  w.EJS_core = props.game.ejs.core
  w.EJS_gameUrl = '/' + props.game.defaultRom
  w.EJS_biosUrl = props.game.ejs.biosUrl || ''
  w.EJS_pathtodata = 'https://cdn.emulatorjs.org/stable/data/'
  w.EJS_gameName = props.game.title
  w.EJS_gameId = props.game.slug
  w.EJS_startOnLoaded = false  // 改为 false，等我们手动恢复状态后再启动
  w.EJS_fullscreenOnLoaded = false

  // ✅ 关键：ready 回调中从 IndexedDB 恢复状态
  w.EJS_ready = () => {
    loading.value = false
    setTimeout(async () => {
      await tryRestoreState()
    }, 200)
  }

  const existing = document.getElementById('ejs-loader')
  if (existing) existing.remove()

  const script = document.createElement('script')
  script.id = 'ejs-loader'
  script.src = 'https://cdn.emulatorjs.org/stable/data/loader.js'
  document.body.appendChild(script)
}

// ✅ 从 IndexedDB 读取存档并恢复
async function tryRestoreState() {
  const emu = (window as any).EJS_emulator
  if (!emu) return

  // 检查 gameManager API 是否可用
  if (typeof emu.gameManager?.loadState !== 'function') {
    // 不支持快照的核心（如 Arcade），正常启动
    try { emu.resume?.() } catch { /* ignore */ }
    return
  }

  const saved = await saves.loadState(props.game.slug)
  if (saved) {
    try {
      emu.gameManager.loadState(saved)
    } catch {
      // 存档损坏，正常启动
      try { emu.resume?.() } catch { /* ignore */ }
    }
  } else {
    // 没有存档，正常启动
    try { emu.resume?.() } catch { /* ignore */ }
  }
}

// ==================== 销毁 ====================

// ✅ 异步关闭：先保存，等一小段确认保存完成，再销毁
async function close() {
  if (isClosing.value) return
  isClosing.value = true

  await saveAndDestroy()
  emit('close')
}

async function saveAndDestroy(): Promise<void> {
  const emu = (window as any).EJS_emulator
  const slug = props.game?.slug
  let stateData: any = null

  if (emu) {
    // 1. 同步获取快照（先抓数据，再杀音视频）
    if (slug && typeof emu.gameManager?.getState === 'function') {
      try {
        stateData = emu.gameManager.getState()
      } catch { /* ignore */ }
    }

    // 2. 立即关闭 AudioContext + 销毁 EJS（音频瞬间停）
    killResidualAudio(emu)
    if (typeof emu.destroy === 'function') {
      try { emu.destroy() } catch { /* ignore */ }
    }
  }

  // 3. 清理 DOM 和全局变量
  cleanupEJS()
  ejsInited.value = false
  loading.value = true

  // 4. 后台写入 IndexedDB（不阻塞音频关闭）
  if (slug && stateData) {
    try {
      await saves.saveState(slug, stateData)
    } catch { /* ignore */ }
  }
}

async function destroyEmulator() {
  await saveAndDestroy()
}

// ==================== 清理 ====================

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

// ==================== AudioContext 清理 ====================

function killResidualAudio(obj: Record<string, any>) {
  // 遍历 EJS 对象关闭 AudioContext
  const paths = [
    'audioContext', 'audioCtx', 'core.audioContext',
    'emulator.audioContext', 'runtime.audioContext',
    'modules.audioContext', 'FS.audioContext',
  ]
  for (const path of paths) {
    try {
      let cur = obj
      for (const key of path.split('.')) {
        if (!cur) break
        cur = cur[key]
      }
      if (cur && typeof cur.state !== 'undefined' && typeof cur.close === 'function') {
        if (cur.state !== 'closed') cur.close()
      }
    } catch { /* ignore */ }
  }

  // 清理 window 上的 AudioContext
  const w = window as any
  ;['audioContext', 'audioCtx', 'ejsAudio', 'gameAudio', 'EJS_audioContext'].forEach(k => {
    try {
      if (w[k] && typeof w[k].close === 'function' && w[k].state !== 'closed') {
        w[k].close()
      }
    } catch {}
  })
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
