export default defineNuxtRouteMiddleware(async (to) => {
  if (process.client) {
    const token = localStorage.getItem('app-token')
    if (!token) return navigateTo('/')

    try {
      const res = await $fetch('/api/auth/me', {
        headers: { authorization: `Bearer ${token}` }
      })
      if (!res.role || res.role !== 'admin') return navigateTo('/')
    } catch {
      return navigateTo('/')
    }
  }
})
