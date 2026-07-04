export function useKeyboardShortcuts() {
  // Register keyboard shortcuts here.
  // Example: Cmd/Ctrl+K for search, Escape for closing modals.

  function handleKeydown(e: KeyboardEvent) {
    // Cmd+K / Ctrl+K — wire up your own modal or command palette
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      // toggle your search or command palette
    }
  }

  onMounted(() => {
    if (import.meta.client) {
      window.addEventListener('keydown', handleKeydown)
    }
  })

  onUnmounted(() => {
    if (import.meta.client) {
      window.removeEventListener('keydown', handleKeydown)
    }
  })
}
