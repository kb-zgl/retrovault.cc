<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <div v-if="panelOpen" class="fab-backdrop open" @click="closePanel" />

    <div class="fab-wrapper">
      <!-- Panel -->
      <div class="fab-panel" :class="{ open: panelOpen }">
        <!-- Now Playing (only when game running/paused) -->
        <div v-if="engine.isRunning.value && engine.currentGame.value" class="fab-now">
          <div class="fab-now-label">{{ t('fab.nowPlaying') }}</div>
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
            :class="{ 'fab-cover-playing': isPlaying(g) }"
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
            <span v-if="isPlaying(g)" class="fab-cover-badge">▶ {{ t('fab.playing') }}</span>
          </button>
        </div>

        <!-- Actions -->
        <div class="fab-actions">
          <button class="fab-action" @click="randomGame">🎲 {{ t('fab.random') }}</button>
          <button v-if="queue.count.value > 0" class="fab-action" @click="queueNext">⏭ {{ t('fab.queue', { count: queue.count.value }) }}</button>
          <button class="fab-action" @click="resumeLast">🕹️ {{ t('fab.history') }}</button>
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
const { t } = useAppI18n()
const { localePath } = useLocalePath()

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
  if (engine.isRunning.value) return engine.isPaused.value ? t('fab.resume') : t('fab.pause')
  return t('fab.quickPlay')
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

// ── Helpers ──

function isPlaying(game: GameSummary | GameData): boolean {
  return engine.isRunning.value && engine.currentGame.value?.slug === game.slug
}

// ── Select game ──

function selectGame(game: GameSummary | GameData) {
  // If same as currently playing → show emulator overlay without navigation
  if (engine.isRunning.value && engine.currentGame.value?.slug === game.slug) {
    engine.resumeGame()
    closePanel()
    return
  }
  // Different game → save current session and navigate
  if (engine.isRunning.value && engine.currentGame.value) {
    history.saveSession(engine.currentGame.value.slug, { highScore: engine.score.value })
  }
  closePanel()
  router.push(localePath(`/games/${game.slug}`))
}

// ── Covers computation ──

const covers = computed<GameSummary[]>(() => {
  const pool = gamePool.value
  if (!pool.length) return []

  const result: GameSummary[] = []
  const seen = new Set<string>()

  const tryAdd = (slug: string): boolean => {
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
    const candidates = pool.filter(g => !seen.has(g.slug))
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
    const { get } = useApi()
    const res: any = await get('/api/games', { query: { limit: 200 } })
    gamePool.value = res.games || []
  } catch {
    // silent
  }
}

function shuffleArray<T>(arr: T[]) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = arr[i]!
    arr[i] = arr[j]!
    arr[j] = tmp
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
    alert(t('fab.emptyQueue'))
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
