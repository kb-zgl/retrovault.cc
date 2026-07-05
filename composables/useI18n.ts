import type { TranslationKey } from '~/types/i18n'

export function useI18n() {
  const locale = useState<'en' | 'zh'>('locale', () => 'en')
  const translations = useState<Record<string, any>>('translations', () => ({}))

  async function setLocale(lang: 'en' | 'zh') {
    if (locale.value === lang) return
    try {
      const data = await import(`~/locales/${lang}.json`)
      translations.value = data.default || data
      locale.value = lang
      const cookie = useCookie('locale', { path: '/', sameSite: 'lax' })
      cookie.value = lang
    } catch (e) {
      console.error(`[i18n] Failed to load locale: ${lang}`, e)
    }
  }

  function t(key: TranslationKey, params?: Record<string, string | number>): string {
    const value = key.split('.').reduce((obj: any, k: string) => obj?.[k], translations.value)
    if (!value) return key
    if (!params) return String(value)
    return String(value).replace(/\{(\w+)\}/g, (_: string, k: string) => String(params[k] ?? ''))
  }

  return { locale, t, setLocale }
}
