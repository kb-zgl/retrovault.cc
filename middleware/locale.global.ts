// middleware/locale.global.ts
// Global middleware — runs on every route navigation
export default defineNuxtRouteMiddleware(async (to) => {
  // Skip API routes and static assets
  if (to.path.startsWith('/api/') || to.path.startsWith('/admin') || to.path.startsWith('/roms/') || to.path.startsWith('/covers/') || to.path.startsWith('/_nuxt/') || to.path.startsWith('/favicon')) {
    return
  }

  const locale = useState<'en' | 'zh'>('locale', () => 'en')
  const translations = useState<Record<string, any>>('translations', () => ({}))
  const cookie = useCookie('locale', { path: '/', sameSite: 'lax' })

  async function loadLang(lang: 'en' | 'zh') {
    if (!translations.value?.nav?.home) {
      const data = await import(`~/locales/${lang}.json`)
      translations.value = data.default || data
    }
  }

  // Detect from URL prefix
  if (to.path.startsWith('/zh')) {
    locale.value = 'zh'
    cookie.value = 'zh'
    await loadLang('zh')
    return // URL stays /zh/..., no redirect
  }

  if (cookie.value === 'zh') {
    // User prefers Chinese but URL has no /zh prefix → redirect
    locale.value = 'zh'
    await loadLang('zh')
    const target = `/zh${to.path === '/' ? '' : to.path}${to.query ? '?' + new URLSearchParams(to.query as any).toString() : ''}`
    return navigateTo(target, { redirectCode: 301 })
  }

  // First visit or cookie=en — detect browser language
  if (!cookie.value) {
    const headers = useRequestHeaders(['accept-language'])
    const acceptLang = headers['accept-language'] || ''
    if (acceptLang.startsWith('zh')) {
      cookie.value = 'zh'
      locale.value = 'zh'
      await loadLang('zh')
      const target = `/zh${to.path === '/' ? '' : to.path}${to.query ? '?' + new URLSearchParams(to.query as any).toString() : ''}`
      return navigateTo(target, { redirectCode: 302 })
    }
  }

  // Default: English
  locale.value = 'en'
  cookie.value = 'en'
  await loadLang('en')
})
