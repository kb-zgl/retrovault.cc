<template>
  <Teleport to="body">
    <div
      class="emulator-overlay"
      :class="{ 'emulator-hidden': !visible }"
    >
      <button class="emulator-close-btn" @click="close" title="Close (Esc)">✕</button>

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

const props = defineProps<{
  game: GameData
  visible: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const iframeRef = ref<HTMLIFrameElement | null>(null)

// ---------- 构建 iframe URL ----------
const iframeSrc = computed(() => {
  const base = '/emulator.html'
  const params = new URLSearchParams({
    core: props.game.ejs.core,
    gameUrl: '/' + props.game.defaultRom,
    gameName: props.game.title,
    gameId: props.game.slug,
    pathtodata: 'https://cdn.emulatorjs.org/stable/data/',
  })
  if (props.game.ejs.biosUrl) {
    params.set('biosUrl', props.game.ejs.biosUrl)
  }
  return `${base}?${params.toString()}`
})

// ---------- 来自 iframe 的消息 ----------
function handleMessage(event: MessageEvent) {
  const { type } = event.data
  if (type === 'exit') {
    emit('close')
  }
  // 'ready' 通知 — 目前无操作，EmulatorJS 自行处理加载 UI
}

// ---------- 快捷键 ----------
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}

function close() {
  emit('close')
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
  window.addEventListener('message', handleMessage)
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
  window.removeEventListener('message', handleMessage)
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
.emulator-iframe {
  flex: 1;
  width: 100%;
  height: 100%;
  border: none;
  background: #000;
}
</style>
