import type { TranslationKey } from '~/types/i18n'

export function useI18n() {
  const locale = useState<'en' | 'zh'>('locale', () => 'en')
  const translations = useState<Record<string, any>>('translations', () => ({}))

  async function setLocale(lang: 'en' | 'zh') {
    locale.value = lang
    const data = await import(`~/locales/${lang}.json`)
    translations.value = data.default || data
    const cookie = useCookie('locale', { path: '/', sameSite: 'lax' })
    cookie.value = lang
  }

  function t(key: TranslationKey, params?: Record<string, string | number>): string {
    const value = key.split('.').reduce((obj: any, k: string) => obj?.[k], translations.value)
    if (!value) return key
    if (!params) return String(value)
    return String(value).replace(/\{(\w+)\}/g, (_: string, k: string) => String(params[k] ?? ''))
  }

  return { locale, t, setLocale }
}
