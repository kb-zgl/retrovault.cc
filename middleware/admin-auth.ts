export default defineNuxtRouteMiddleware(async (to) => {
  if (process.client) {
    const token = localStorage.getItem('app-token')
    console.log('[admin-auth] token exists:', !!token)
    if (!token) return navigateTo('/')

    try {
      const res = await $fetch('/api/auth/me', {
        headers: { authorization: `Bearer ${token}` }
      })
      console.log('[admin-auth] me response:', res)
      if (!res.role || res.role !== 'admin') return navigateTo('/')
    } catch (e) {
      console.error('[admin-auth] me failed:', e)
      return navigateTo('/')
    }
  }
})
