const STORAGE_KEY = 'playQueue'

export function useGameQueue() {
  const queue = ref<string[]>([])

  function load() {
    if (import.meta.server) return
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      queue.value = raw ? JSON.parse(raw) : []
    } catch {
      queue.value = []
    }
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue.value))
  }

  function add(slug: string) {
    if (!queue.value.includes(slug)) {
      queue.value.push(slug)
      save()
    }
  }

  function remove(slug: string) {
    queue.value = queue.value.filter(s => s !== slug)
    save()
  }

  function toggle(slug: string) {
    if (queue.value.includes(slug)) {
      remove(slug)
    } else {
      add(slug)
    }
  }

  function has(slug: string): boolean {
    return queue.value.includes(slug)
  }

  // Take first, rotate to back
  function consume(): string | null {
    if (queue.value.length === 0) return null
    const first = queue.value.shift()!
    queue.value.push(first)
    save()
    return first
  }

  function clear() {
    queue.value = []
    save()
  }

  const count = computed(() => queue.value.length)

  // Initialize on client
  if (!import.meta.server) {
    load()
  }

  return { queue, count, add, remove, toggle, has, consume, clear, load }
}
