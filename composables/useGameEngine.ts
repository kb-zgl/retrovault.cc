import type { GameData } from '~/types/games'

/**
 * Game engine state — single source of truth for:
 * - Current loaded game
 * - Running/paused/stopped state
 * - Score tracking
 * - localStorage persistence (history, queue, saves)
 */
export function useGameEngine() {
  const currentGame = ref<GameData | null>(null)
  const isRunning = ref(false)
  const isPaused = ref(false)
  const score = ref(0)

  // EmulatorJS overlay visibility
  const showEmulator = ref(false)
  // Float window visibility
  const showFloat = ref(false)

  // Load a game to play
  function loadGame(game: GameData) {
    // Save current game progress first
    if (currentGame.value && currentGame.value.slug !== game.slug) {
      saveHistory()
    }

    currentGame.value = game
    score.value = 0
    isRunning.value = true
    isPaused.value = false
    showEmulator.value = true
    showFloat.value = false

    // Persist
    localStorage.setItem('currentGameId', game.slug)
    recordPlay(game.slug)
  }

  // Called when EmulatorJS overlay is closed → show float window
  function closeEmulator() {
    showEmulator.value = false
    isRunning.value = false
    showFloat.value = true
    saveHistory()
  }

  // Toggle pause
  function togglePause() {
    isPaused.value = !isPaused.value
  }

  // Close float window (game fully stopped)
  function closeGame() {
    showFloat.value = false
    showEmulator.value = false
    isRunning.value = false
    isPaused.value = false
    saveHistory()
  }

  // Update score
  function setScore(val: number) {
    score.value = val
  }

  // ── localStorage helpers ──

  function getHistory(): string[] {
    try {
      return JSON.parse(localStorage.getItem('userGameHistory') || '[]')
    } catch {
      return []
    }
  }

  function recordPlay(slug: string) {
    const history = getHistory().filter(s => s !== slug)
    history.unshift(slug)
    localStorage.setItem('userGameHistory', JSON.stringify(history.slice(0, 50)))
  }

  function saveHistory() {
    if (!currentGame.value) return
    const slug = currentGame.value.slug
    const key = `gameHistory_${slug}`
    try {
      const entry = JSON.parse(localStorage.getItem(key) || '{}')
      entry.lastPlayedAt = Date.now()
      entry.playCount = (entry.playCount || 0) + 1
      entry.highScore = Math.max(entry.highScore || 0, score.value)
      localStorage.setItem(key, JSON.stringify(entry))
    } catch {
      // ignore parse errors
    }
  }

  // Restore last game on mount
  function restoreLastGame(): string | null {
    return localStorage.getItem('currentGameId')
  }

  return {
    currentGame,
    isRunning,
    isPaused,
    score,
    showEmulator,
    showFloat,
    loadGame,
    closeEmulator,
    togglePause,
    closeGame,
    setScore,
    restoreLastGame,
  }
}
