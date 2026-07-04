import type { GameData } from '~/types/games'

/**
 * Game engine state — SINGLETON (module-scoped refs).
 * All consumers share the same state.
 */

// Module-scoped state (shared across components)
const currentGame = ref<GameData | null>(null)
const isRunning = ref(false)
const isPaused = ref(false)
const score = ref(0)
const showEmulator = ref(false)

export function useGameEngine() {

  function loadGame(game: GameData) {
    currentGame.value = game
    score.value = 0
    isRunning.value = true
    isPaused.value = false
    showEmulator.value = true
    localStorage.setItem('currentGameId', game.slug)
  }

  /** Close emulator — stops audio, destroys EJS instance */
  function closeGame() {
    showEmulator.value = false
    isRunning.value = false
    isPaused.value = false
  }

  /** Re-launch emulator for same game — re-inits EJS, loads save state from localStorage */
  function resumeGame() {
    if (!currentGame.value) return
    showEmulator.value = true
    isRunning.value = true
    isPaused.value = false
  }

  function togglePause() {
    isPaused.value = !isPaused.value
  }

  function setScore(val: number) {
    score.value = val
  }

  function restoreLastGame(): string | null {
    return localStorage.getItem('currentGameId')
  }

  return {
    currentGame,
    isRunning,
    isPaused,
    score,
    showEmulator,
    loadGame,
    closeGame,
    resumeGame,
    togglePause,
    setScore,
    restoreLastGame,
  }
}
