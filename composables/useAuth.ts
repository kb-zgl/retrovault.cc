export interface AuthUser {
  id: string
  email: string
  username: string
  avatarUrl: string | null
  createdAt: number
}

// Module-level shared state — required so app.vue and AuthButton share same refs
const token = ref<string | null>(null)
const user = ref<AuthUser | null>(null)
const loading = ref(false)
const showAuthModal = ref(false)

function lsGet(): string | null {
  if (import.meta.server) return null
  return localStorage.getItem('app-token')
}

export const useAuth = () => {
  const { get } = useApi()
  const isLoggedIn = computed(() => !!token.value)

  async function fetchUser() {
    const t = token.value
    if (!t) {
      loading.value = false
      return
    }
    loading.value = true
    try {
      const data = await get<AuthUser>('/api/auth/me', {
        headers: { Authorization: `Bearer ${t}` },
      })
      user.value = data
    } catch {
      user.value = null
    } finally {
      loading.value = false
    }
  }

  function login() {
    showAuthModal.value = true
  }

  function logout() {
    localStorage.removeItem('app-token')
    token.value = null
    user.value = null
    navigateTo('/')
  }

  /** Restore token from localStorage */
  function handleUrlToken() {
    if (import.meta.server) return
    const stored = lsGet()
    if (stored) {
      token.value = stored
      fetchUser()
    } else {
      loading.value = false
    }
  }

  return { token, user, loading, isLoggedIn, showAuthModal, login, logout, fetchUser, handleUrlToken }
}
