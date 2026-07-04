/**
 * Game progress saves — localStorage-based save states per game.
 * Future: migrate to D1 when user system is added.
 */
export function useGameSaves() {
  function save(slug: string, state: Record<string, any>) {
    const key = `gameSave_${slug}`
    try {
      const existing = JSON.parse(localStorage.getItem(key) || '{}')
      localStorage.setItem(key, JSON.stringify({ ...existing, ...state, savedAt: Date.now() }))
    } catch {
      localStorage.setItem(key, JSON.stringify({ ...state, savedAt: Date.now() }))
    }
  }

  function load(slug: string): Record<string, any> | null {
    try {
      const raw = localStorage.getItem(`gameSave_${slug}`)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }

  function remove(slug: string) {
    localStorage.removeItem(`gameSave_${slug}`)
  }

  function hasSave(slug: string): boolean {
    try {
      return localStorage.getItem(`gameSave_${slug}`) !== null
    } catch {
      return false
    }
  }

  return { save, load, remove, hasSave }
}
