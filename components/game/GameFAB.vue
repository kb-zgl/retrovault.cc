<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <div v-if="menuOpen" class="fab-backdrop open" @click="closeFab" />

    <div class="fab-container">
      <!-- Menu -->
      <div class="fab-menu" :class="{ open: menuOpen }">
        <button class="fab-menu-item" @click="randomGame">🎲 Random Game</button>
        <button class="fab-menu-item" @click="queueNext">
          ⏭ Queue <span id="fabQueueCount">{{ queue.count }}</span>
        </button>
        <button class="fab-menu-item" @click="resumeLast">🕹️ Resume Last</button>
      </div>

      <!-- FAB button -->
      <button
        class="fab-btn"
        :class="fabState"
        @click="handleFabClick"
        :title="fabTitle"
      >
        {{ fabIcon }}
        <span v-if="showScore" class="fab-score">{{ score }}</span>
      </button>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useGameEngine } from '~/composables/useGameEngine'
import { useGameQueue } from '~/composables/useGameQueue'
import { useGameHistory } from '~/composables/useGameHistory'

const router = useRouter()
const engine = useGameEngine()
const queue = useGameQueue()
const history = useGameHistory()
const route = useRoute()

const menuOpen = ref(false)

// FAB state derived from engine
const fabState = computed(() => {
  if (engine.isRunning.value && !engine.isPaused.value) return 'playing'
  if (engine.isRunning.value && engine.isPaused.value) return 'paused-state'
  return 'idle'
})

const fabIcon = computed(() => {
  if (engine.isRunning.value && !engine.isPaused.value) return '⏸'
  if (engine.isRunning.value && engine.isPaused.value) return '▶'
  return '🎮'
})

const fabTitle = computed(() => {
  if (engine.isRunning.value) return engine.isPaused.value ? 'Resume' : 'Pause'
  return 'Quick play'
})

const showScore = computed(() => engine.isRunning.value && !engine.isPaused.value)
const score = computed(() => engine.score.value)

function closeFab() {
  menuOpen.value = false
}

function handleFabClick() {
  if (engine.isRunning.value) {
    engine.togglePause()
    menuOpen.value = false
    return
  }
  menuOpen.value = !menuOpen.value
}

// Menu actions
function randomGame() {
  closeFab()
  // Navigate to a random game — we'll pick from recent API data
  router.push(`/games/${randomSlug.value}`)
}

function queueNext() {
  closeFab()
  const next = queue.consume()
  if (!next) {
    alert('Queue is empty! Add games first.')
    return
  }
  router.push(`/games/${next}`)
}

function resumeLast() {
  closeFab()
  const last = history.getLastPlayed()
  if (last) {
    router.push(`/games/${last}`)
  } else {
    randomGame()
  }
}

// Generate a random slug from available games
// Use a small cache to avoid fetching on every click
const randomSlug = ref('')
async function pickRandom() {
  try {
    const res = await $fetch('/api/games', { query: { limit: 200 } })
    const games = res.games || []
    if (games.length > 0) {
      randomSlug.value = games[Math.floor(Math.random() * games.length)].slug
    }
  } catch {
    randomSlug.value = ''
  }
}

onMounted(() => {
  pickRandom()
})
</script>
