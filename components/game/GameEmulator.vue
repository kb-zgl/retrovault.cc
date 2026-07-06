<template>
  <Teleport to="body">
    <div
      class="emulator-overlay"
      :class="{ 'emulator-hidden': !visible }"
    >
      <button class="emulator-close-btn" @click="close" title="Close (Esc)">✕</button>

      <!-- 加载状态 -->
      <div v-if="loading" class="emulator-loading">
        <div class="emulator-loading-spinner"></div>
        <span>{{ t('game.loadingEmulator') }}</span>
      </div>

      <!-- 模拟器 iframe -->
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
import type { GameData } from '~/types/games'
import { useGameSaves } from '~/composables/useGameSaves'

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
const pendingStateResolve = ref<((value: ArrayBuffer) => void) | null>(null)

// ---------- 构建 iframe URL ----------
const iframeSrc = computed(() => {
  const base = '/emulator.html'
  const params = new URLSearchParams({
    core: props.game.ejs.core,
    gameUrl: '/' + props.game.defaultRom, // 确保路径正确
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
  iframeRef.value?.contentWindow?.postMessage(data, '*')
}

// ---------- 监听来自 iframe 的消息 ----------
function handleMessage(event: MessageEvent) {
  const { type, state } = event.data
  if (type === 'ready') {
    emulatorReady.value = true
    loading.value = false
    // 自动尝试加载存档
    tryLoadSave()
    return
  }

  if (type === 'save') {
    // iframe 发来存档数据，保存到 IndexedDB
    if (state) {
      saves.saveState(props.game.slug, state)
    }
    return
  }

  if (type === 'load') {
    // iframe 请求读取存档
    tryLoadSave()
    return
  }

  if (type === 'stateResponse') {
    // 响应 getState 请求，用于退出前保存
    if (pendingStateResolve.value) {
      pendingStateResolve.value(state)
      pendingStateResolve.value = null
    }
    return
  }
}

// ---------- 加载存档（从 IndexedDB 读取并发送给 iframe） ----------
async function tryLoadSave() {
  if (!emulatorReady.value) return
  const saved = await saves.loadState(props.game.slug)
  if (saved) {
    postToIframe({ type: 'loadState', state: saved })
  }
}

// ---------- 主动获取状态（用于退出时） ----------
function requestState(): Promise<ArrayBuffer> {
  return new Promise((resolve) => {
    pendingStateResolve.value = resolve
    postToIframe({ type: 'getState' })
    // 超时处理
    setTimeout(() => {
      if (pendingStateResolve.value) {
        pendingStateResolve.value(null as any)
        pendingStateResolve.value = null
      }
    }, 3000)
  })
}

// ---------- 关闭流程 ----------
async function close() {
  if (isClosing.value) return
  isClosing.value = true
  loading.value = true // 显示保存中

  // 1. 请求 iframe 返回当前状态
  const state = await requestState().catch(() => null)
  if (state) {
    await saves.saveState(props.game.slug, state)
  }

  // 2. 通知 iframe 销毁
  postToIframe({ type: 'destroy' })

  // 3. 移除 iframe 引用
  iframeRef.value?.remove()

  // 4. 重置状态
  emulatorReady.value = false
  loading.value = false
  isClosing.value = false

  emit('close')
}

// ---------- 快捷键 Esc 关闭 ----------
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') close()
}

// ---------- 生命周期 ----------
onMounted(() => {
  document.addEventListener('keydown', onKeydown)
  window.addEventListener('message', handleMessage)
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
  window.removeEventListener('message', handleMessage)
  // 如果组件被意外卸载，尝试保存
  if (!isClosing.value) {
    close()
  }
})

// 切换游戏时重置（父组件会控制 visible 变化，我们通过 watch 处理）
watch(() => props.visible, (val) => {
  if (!val && !isClosing.value) {
    // 如果 visible 变为 false，主动关闭
    close()
  }
})
</script>

<style scoped>
/* 保持原有样式，修改 .emulator-zone 为 iframe 样式 */
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

.emulator-iframe {
  flex: 1;
  width: 100%;
  height: 100%;
  border: none;
  background: #000;
}
</style>