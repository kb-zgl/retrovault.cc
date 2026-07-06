<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="emulator-overlay"
    >
      <button class="emulator-close-btn" @click="close" title="Close (Esc)">✕</button>

      <div v-if="loading" class="emulator-loading">
        <div class="emulator-loading-spinner"></div>
        <span>{{ t('game.loadingEmulator') }}</span>
      </div>

      <iframe
        ref="iframeRef"
        :src="iframeSrc"
        class="emulator-iframe"
        allowfullscreen
        allow="autoplay; encrypted-media; fullscreen"
      />
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import type { GameData } from '~/types/games'
import { useGameSaves } from '~/composables/useGameSaves'
// 假设你有这些导入
// import { useAppI18n } from '...' 

const props = defineProps<{
  game: GameData
  visible: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const { t } = useAppI18n()
const saves = useGameSaves()

const iframeRef = ref<HTMLIFrameElement | null>(null)
const loading = ref(true)
const isClosing = ref(false)
const emulatorReady = ref(false)
const pendingStateResolve = ref<((value: ArrayBuffer | null) => void) | null>(null)

// ---------- 构建 iframe URL ----------
const iframeSrc = computed(() => {
  const base = '/frame.html' // 确保这里与你实际的文件名一致
  const params = new URLSearchParams({
    core: props.game.ejs.core,
    gameUrl: '/' + props.game.defaultRom, // 确保这个路径可以在 iframe 所在的域被跨域访问
    gameName: props.game.title,
    gameId: props.game.slug,
    pathtodata: 'https://cdn.emulatorjs.org/stable/data/',
  })
  if (props.game.ejs.biosUrl) {
    params.set('biosUrl', props.game.ejs.biosUrl)
  }
  return `${base}?${params.toString()}`
})

// ---------- 与 iframe 通信 ----------
function postToIframe(data: any) {
  if (iframeRef.value?.contentWindow) {
    iframeRef.value.contentWindow.postMessage(data, '*')
  }
}

// ---------- 监听来自 iframe 的消息 ----------
function handleMessage(event: MessageEvent) {
  // 增加基础安全/格式检查
  if (!event.data || typeof event.data !== 'object') return

  const { type, state } = event.data

  if (type === 'ready') {
    emulatorReady.value = true
    loading.value = false
    // 自动尝试加载存档
    tryLoadSave()
    return
  }

  if (type === 'save') {
    if (state) saves.saveState(props.game.slug, state)
    return
  }

  if (type === 'load') {
    tryLoadSave()
    return
  }

  if (type === 'stateResponse') {
    if (pendingStateResolve.value) {
      pendingStateResolve.value(state)
      pendingStateResolve.value = null
    }
    return
  }
}

// ---------- 加载存档 ----------
async function tryLoadSave() {
  if (!emulatorReady.value) return
  const saved = await saves.loadState(props.game.slug)
  if (saved) {
    postToIframe({ type: 'loadState', state: saved })
  }
}

// ---------- 获取状态（用于退出时） ----------
function requestState(): Promise<ArrayBuffer | null> {
  return new Promise((resolve) => {
    pendingStateResolve.value = resolve
    postToIframe({ type: 'getState' })
    // 超时处理
    setTimeout(() => {
      if (pendingStateResolve.value) {
        pendingStateResolve.value(null)
        pendingStateResolve.value = null
      }
    }, 2000) // 缩短超时时间，避免卡死退出流程
  })
}

// ---------- 关闭流程 ----------
async function close() {
  if (isClosing.value || !props.visible) return
  isClosing.value = true
  loading.value = true // 显示 loading 作为“正在保存”的提示

  if (emulatorReady.value) {
    // 1. 请求 iframe 返回当前状态
    const state = await requestState().catch(() => null)
    if (state) {
      await saves.saveState(props.game.slug, state)
    }
    // 2. 通知销毁，释放 WebGL/AudioContext 等资源
    postToIframe({ type: 'destroy' })
  }

  // 重置状态
  emulatorReady.value = false
  loading.value = false
  isClosing.value = false
  emit('close') // 触发父组件将 visible 设为 false，v-if 自动销毁 DOM
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.visible) close()
}

// ---------- 生命周期 ----------
onMounted(() => {
  document.addEventListener('keydown', onKeydown)
  window.addEventListener('message', handleMessage)
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
  window.removeEventListener('message', handleMessage)
})

// 监听 visible 变化：重置 loading 状态
watch(() => props.visible, (newVal) => {
  if (newVal) {
    loading.value = true
    emulatorReady.value = false
  } else if (!isClosing.value) {
    close()
  }
})
</script>