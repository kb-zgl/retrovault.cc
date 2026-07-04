<template>
  <Teleport to="body">
    <div
      v-if="visible"
      ref="windowRef"
      class="game-float-window"
      :class="{ minimized: isMinimized }"
      :style="posStyle"
    >
      <!-- Header (draggable) -->
      <div
        class="game-float-header"
        @mousedown.prevent="startDrag"
        @touchstart.prevent="startDragTouch"
      >
        <span class="window-title">
          🕹️ <span class="game-name">{{ game?.title || '-' }}</span>
        </span>
        <div class="window-actions">
          <button
            class="minimize-btn"
            :title="isMinimized ? 'Expand' : 'Minimize'"
            @click="isMinimized = !isMinimized"
          >
            {{ isMinimized ? '▲' : '▼' }}
          </button>
          <button class="close-btn" title="Close" @click="$emit('close')">
            ✕
          </button>
        </div>
      </div>

      <!-- Body -->
      <div class="game-float-body">
        <div class="float-game-info">
          <span class="float-score">🏆 <span>{{ score }}</span></span>
          <span class="float-status">
            <span
              class="status-dot"
              :class="statusClass"
            ></span>
            <span>{{ statusLabel }}</span>
          </span>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { GameData } from '~/types/games'

const props = defineProps<{
  game: GameData | null
  visible: boolean
  score?: number
  status?: 'running' | 'paused' | 'stopped'
}>()

defineEmits<{
  close: []
}>()

const isMinimized = ref(false)
const windowRef = ref<HTMLElement | null>(null)

// Drag state
const posStyle = ref<Record<string, string>>({})
let dragging = false
let dragStart = { x: 0, y: 0, left: 0, top: 0 }

function startDrag(e: MouseEvent) {
  if ((e.target as HTMLElement).closest('.window-actions')) return
  dragging = true
  const el = windowRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  dragStart = { x: e.clientX, y: e.clientY, left: rect.left, top: rect.top }
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
}

function startDragTouch(e: TouchEvent) {
  if ((e.target as HTMLElement).closest('.window-actions')) return
  dragging = true
  const el = windowRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  dragStart = { x: e.touches[0].clientX, y: e.touches[0].clientY, left: rect.left, top: rect.top }
  document.addEventListener('touchmove', onDragTouch)
  document.addEventListener('touchend', stopDrag)
}

function onDrag(e: MouseEvent) {
  if (!dragging) return
  posStyle.value = {
    left: `${dragStart.left + e.clientX - dragStart.x}px`,
    top: `${dragStart.top + e.clientY - dragStart.y}px`,
    right: 'auto',
    bottom: 'auto',
  }
}

function onDragTouch(e: TouchEvent) {
  if (!dragging) return
  posStyle.value = {
    left: `${dragStart.left + e.touches[0].clientX - dragStart.x}px`,
    top: `${dragStart.top + e.touches[0].clientY - dragStart.y}px`,
    right: 'auto',
    bottom: 'auto',
  }
}

function stopDrag() {
  dragging = false
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('touchmove', onDragTouch)
  document.removeEventListener('touchend', stopDrag)
}

onUnmounted(() => {
  stopDrag()
})

// Status display
const statusClass = computed(() => {
  switch (props.status) {
    case 'running': return 'running'
    case 'paused': return 'paused'
    default: return 'stopped'
  }
})

const statusLabel = computed(() => {
  switch (props.status) {
    case 'running': return 'Running'
    case 'paused': return 'Paused'
    default: return 'Game Over'
  }
})
</script>

<style scoped>
.game-float-window {
  position: fixed;
  bottom: 90px;
  right: 12px;
  z-index: 1000;
  width: 220px;
  max-width: 45vw;
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: 0 10px 40px rgba(0,0,0,0.6);
  overflow: hidden;
}
.game-float-window.minimized {
  width: 130px;
  border-radius: var(--radius-lg);
}
.game-float-window.minimized .game-float-body {
  display: none;
}

.game-float-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 12px 6px 16px;
  background: var(--color-bg-elevated);
  border-bottom: 1px solid var(--color-border);
  cursor: grab;
  user-select: none;
}
.window-title {
  font-family: var(--font-pixel);
  font-size: clamp(0.45rem, 1.4vw, 0.55rem);
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  gap: 6px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.game-name {
  color: var(--color-success);
}

.window-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}
.window-actions button {
  background: none;
  border: 1px solid var(--color-border);
  border-radius: 50%;
  color: var(--color-text-muted);
  cursor: pointer;
  font-size: clamp(0.6rem, 2vw, 0.8rem);
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.1s ease;
  font-family: var(--font-body);
  padding: 0;
}
.window-actions button:hover {
  background: rgba(255,255,255,0.04);
  color: var(--color-text-primary);
  border-color: var(--color-accent);
}
.close-btn {
  color: var(--color-accent) !important;
}
.close-btn:hover {
  background: rgba(224, 45, 122, 0.15) !important;
  border-color: var(--color-accent) !important;
}

.game-float-body {
  padding: 8px;
  background: var(--color-bg-base);
}

.float-game-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: var(--font-body);
  font-size: clamp(0.5rem, 1.3vw, 0.6rem);
  color: var(--color-text-muted);
  letter-spacing: 0;
}
.float-score {
  color: var(--color-success);
}
.float-status {
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  gap: 4px;
}
.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  display: inline-block;
}
.status-dot.running {
  background: var(--color-success);
  animation: blink 0.8s infinite alternate;
}
.status-dot.paused {
  background: var(--color-warning);
}
.status-dot.stopped {
  background: var(--color-text-muted);
}

@media (min-width: 600px) {
  .game-float-window { width: 280px; max-width: 30vw; bottom: 100px; right: 20px; }
  .game-float-window.minimized { width: 160px; }
}

@media (min-width: 1024px) {
  .game-float-window { width: 320px; max-width: 22vw; bottom: 110px; right: 28px; }
  .game-float-window.minimized { width: 190px; }
}
</style>
