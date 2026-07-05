// middleware/locale.global.ts
// Global middleware — runs on every route navigation
export default defineNuxtRouteMiddleware(async (to) => {
  // Skip API routes and static assets
  if (to.path.startsWith('/api/') || to.path.startsWith('/roms/') || to.path.startsWith('/covers/') || to.path.startsWith('/_nuxt/') || to.path.startsWith('/favicon')) {
    return
  }

  const locale = useState<'en' | 'zh'>('locale', () => 'en')
  const translations = useState<Record<string, any>>('translations', () => ({}))

  // Detect from URL prefix
  if (to.path.startsWith('/zh')) {
    locale.value = 'zh'
    const cookie = useCookie('locale', { path: '/', sameSite: 'lax' })
    cookie.value = 'zh'
    // Lazy-load Chinese translations
    if (!translations.value?.nav?.home) {
      const data = await import(`~/locales/zh.json`)
      translations.value = data.default || data
    }
    return // URL stays /zh/..., no redirect
  }

  // No /zh prefix — check cookie
  const cookie = useCookie('locale', { path: '/', sameSite: 'lax' })

  if (cookie.value === 'zh') {
    // User prefers Chinese but URL has no /zh prefix → redirect
    locale.value = 'zh'
    if (!translations.value?.nav?.home) {
      const data = await import(`~/locales/zh.json`)
      translations.value = data.default || data
    }
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
      if (!translations.value?.nav?.home) {
        const data = await import(`~/locales/zh.json`)
        translations.value = data.default || data
      }
      const target = `/zh${to.path === '/' ? '' : to.path}${to.query ? '?' + new URLSearchParams(to.query as any).toString() : ''}`
      return navigateTo(target, { redirectCode: 302 })
    }
  }

  // Default: English
  locale.value = 'en'
  cookie.value = 'en'
  if (!translations.value?.nav?.home) {
    const data = await import(`~/locales/en.json`)
    translations.value = data.default || data
  }
})
