export function useAdmin() {
  const token = ref<string | null>(null)
  const user = ref<any>(null)
  const isAdmin = computed(() => !!user.value)

  async function checkAuth() {
    const t = localStorage.getItem('app-token')
    if (!t) return false
    token.value = t
    try {
      const res = await $fetch('/api/auth/me', {
        headers: { authorization: `Bearer ${t}` }
      })
      user.value = res
      if (!res.role || res.role !== 'admin') {
        user.value = null
        return false
      }
      return true
    } catch {
      user.value = null
      return false
    }
  }

  function adminFetch(url: string, opts?: any) {
    const t = localStorage.getItem('app-token')
    return $fetch(url, {
      ...opts,
      headers: {
        ...opts?.headers,
        authorization: t ? `Bearer ${t}` : '',
      }
    })
  }

  return { token, user, isAdmin, checkAuth, adminFetch }
}
