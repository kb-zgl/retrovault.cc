<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <div v-if="panelOpen" class="fab-backdrop open" @click="closePanel" />

    <div class="fab-wrapper">
      <!-- Panel -->
      <div class="fab-panel" :class="{ open: panelOpen }">
        <!-- Now Playing (only when game running/paused) -->
        <div v-if="engine.isRunning.value && engine.currentGame.value" class="fab-now">
          <div class="fab-now-label">● Now Playing</div>
          <button class="fab-now-card" @click="selectGame(engine.currentGame.value)">
            <img
              :src="`/covers/${engine.currentGame.value.slug}.webp`"
              :alt="engine.currentGame.value.title"
              class="fab-now-cover"
              @error="($event.target as HTMLImageElement).style.display = 'none'"
            />
            <div class="fab-now-info">
              <div class="fab-now-title">{{ engine.currentGame.value.title }}</div>
              <div class="fab-now-score">🏆 {{ engine.score.value }}</div>
            </div>
          </button>
        </div>

        <!-- Covers row -->
        <div class="fab-covers-row">
          <button
            v-for="g in covers"
            :key="g.slug"
            class="fab-cover"
            @click="selectGame(g)"
          >
            <img
              :src="`/covers/${g.slug}.webp`"
              :alt="g.title"
              class="fab-cover-img"
              loading="lazy"
              @error="($event.target as HTMLImageElement).style.display = 'none'"
            />
            <span class="fab-cover-label">{{ g.title.slice(0, 10) }}</span>
          </button>
        </div>

        <!-- Actions -->
        <div class="fab-actions">
          <button class="fab-action" @click="randomGame">🎲 Random</button>
          <button v-if="queue.count > 0" class="fab-action" @click="queueNext">⏭ Queue ({{ queue.count }})</button>
          <button class="fab-action" @click="resumeLast">🕹️ History</button>
        </div>
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
import type { GameSummary, GameData } from '~/types/games'

const router = useRouter()
const engine = useGameEngine()
const queue = useGameQueue()
const history = useGameHistory()

const panelOpen = ref(false)
const gamePool = ref<GameSummary[]>([])

// ── FAB states ──

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

// ── Panel toggle ──

function closePanel() {
  panelOpen.value = false
}

function handleFabClick() {
  if (engine.isRunning.value) {
    engine.togglePause()
    // Resumed → close panel; paused → show panel
    if (!engine.isPaused.value) {
      panelOpen.value = false
      return
    }
  }
  panelOpen.value = !panelOpen.value
  if (panelOpen.value) ensurePool()
}

// ── Select game ──

function selectGame(game: GameSummary | GameData) {
  if (engine.isRunning.value && engine.currentGame.value) {
    history.saveSession(engine.currentGame.value.slug, { highScore: engine.score.value })
  }
  closePanel()
  router.push(`/games/${game.slug}`)
}

// ── Covers computation ──

const covers = computed<GameSummary[]>(() => {
  const pool = gamePool.value
  if (!pool.length) return []

  const result: GameSummary[] = []
  const seen = new Set<string>()

  // If a game is running, skip it from the covers row (shown in Now Playing)
  const skipSlug = engine.isRunning.value ? engine.currentGame.value?.slug : null

  const tryAdd = (slug: string): boolean => {
    if (seen.has(slug) || slug === skipSlug) return false
    const found = pool.find(g => g.slug === slug)
    if (!found) return false
    result.push(found)
    seen.add(slug)
    return true
  }

  // History
  for (const slug of history.getRecent(5)) {
    if (result.length >= 5) break
    tryAdd(slug)
  }

  // Queue
  for (const slug of queue.queue.value) {
    if (result.length >= 5) break
    tryAdd(slug)
  }

  // Random fill
  if (result.length < 5) {
    const candidates = pool.filter(g => !seen.has(g.slug) && g.slug !== skipSlug)
    shuffleArray(candidates)
    for (const g of candidates) {
      if (result.length >= 5) break
      result.push(g)
      seen.add(g.slug)
    }
  }

  return result
})

// ── Game pool ──

let poolPromise: Promise<void> | null = null

async function ensurePool() {
  if (gamePool.value.length > 0) return
  if (poolPromise) return poolPromise
  poolPromise = fetchPool()
  await poolPromise
}

async function fetchPool() {
  try {
    const res: any = await $fetch('/api/games', { query: { limit: 200 } })
    gamePool.value = res.games || []
  } catch {
    // silent
  }
}

function shuffleArray<T>(arr: T[]) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
}

// ── Action handlers ──

function randomGame() {
  if (engine.isRunning.value && engine.currentGame.value) {
    history.saveSession(engine.currentGame.value.slug, { highScore: engine.score.value })
  }
  closePanel()
  const pick = gamePool.value[Math.floor(Math.random() * gamePool.value.length)]
  if (pick) router.push(`/games/${pick.slug}`)
}

function queueNext() {
  const next = queue.consume()
  if (!next) {
    alert('Queue is empty! Add games first.')
    closePanel()
    return
  }
  if (engine.isRunning.value && engine.currentGame.value) {
    history.saveSession(engine.currentGame.value.slug, { highScore: engine.score.value })
  }
  closePanel()
  router.push(`/games/${next}`)
}

function resumeLast() {
  if (engine.isRunning.value && engine.currentGame.value) {
    history.saveSession(engine.currentGame.value.slug, { highScore: engine.score.value })
  }
  closePanel()
  const last = history.getLastPlayed()
  if (last) {
    router.push(`/games/${last}`)
  } else {
    randomGame()
  }
}

onMounted(() => {
  ensurePool()
})
</script>
