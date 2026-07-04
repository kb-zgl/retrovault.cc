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
const showFloat = ref(false)

export function useGameEngine() {

  function loadGame(game: GameData) {
    currentGame.value = game
    score.value = 0
    isRunning.value = true
    isPaused.value = false
    showEmulator.value = true
    showFloat.value = false
    localStorage.setItem('currentGameId', game.slug)
  }

  function closeEmulator() {
    showEmulator.value = false
    isRunning.value = false
    showFloat.value = true
  }

  function togglePause() {
    isPaused.value = !isPaused.value
  }

  function closeGame() {
    showFloat.value = false
    showEmulator.value = false
    isRunning.value = false
    isPaused.value = false
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
    showFloat,
    loadGame,
    closeEmulator,
    togglePause,
    closeGame,
    setScore,
    restoreLastGame,
  }
}
