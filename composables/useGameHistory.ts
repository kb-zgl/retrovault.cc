import type { GameHistoryEntry } from '~/types/games'

const HISTORY_KEY = 'userGameHistory'
const MAX_HISTORY = 50

export function useGameHistory() {
  const history = ref<string[]>([])

  function load() {
    if (import.meta.server) return
    try {
      const raw = localStorage.getItem(HISTORY_KEY)
      history.value = raw ? JSON.parse(raw) : []
    } catch {
      history.value = []
    }
  }

  function save() {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.value))
  }

  // Record a game play (slug goes to front, dedup)
  function record(slug: string) {
    history.value = [slug, ...history.value.filter(s => s !== slug)].slice(0, MAX_HISTORY)
    save()
  }

  // Get recent slugs
  function getRecent(limit = 6): string[] {
    return history.value.slice(0, limit)
  }

  // Get the last played game slug
  function getLastPlayed(): string | null {
    return history.value[0] || null
  }

  // Save per-game play session data
  function saveSession(slug: string, data: Partial<GameHistoryEntry>) {
    const key = `gameSession_${slug}`
    try {
      const existing = JSON.parse(localStorage.getItem(key) || '{}')
      const merged = { ...existing, ...data, lastPlayedAt: Date.now() }
      merged.playCount = (merged.playCount || 0) + 1
      localStorage.setItem(key, JSON.stringify(merged))
    } catch {
      localStorage.setItem(key, JSON.stringify({ ...data, lastPlayedAt: Date.now(), playCount: 1 }))
    }
  }

  // Load per-game session data
  function loadSession(slug: string): Partial<GameHistoryEntry> | null {
    try {
      const raw = localStorage.getItem(`gameSession_${slug}`)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }

  if (!import.meta.server) {
    load()
  }

  return { history, load, record, getRecent, getLastPlayed, saveSession, loadSession }
}
