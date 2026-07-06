/**
 * Get localized game content based on current locale.
 * Falls back to English if locale content is missing.
 */
export function useGameLocale() {
  const locale = useState<'en' | 'zh' | 'ja'>('locale', () => 'en')

  function localized(game: any) {
    const lang = locale.value
    const langs = game?.langs || {}
    const loc = langs[lang] || {}
    const fallback = langs['en'] || {}

    return {
      title: loc.title || game?.title || fallback.title || '',
      description: loc.description || game?.description || fallback.description || '',
      longDesc: loc.longDesc || fallback.longDesc || [],
      controls: loc.controls || fallback.controls || null,
      tags: loc.tags || game?.tags || fallback.tags || [],
    }
  }

  return { localized, locale }
}
