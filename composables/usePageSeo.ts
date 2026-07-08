import type { MaybeRefOrGetter } from 'vue'

function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  return text.slice(0, max - 1).trimEnd() + '…'
}

function formatDescription(text: string, max = 158): string {
  return truncate(text.replace(/\s+/g, ' ').trim(), max)
}

interface PageSeoOptions {
  /** 完整 title（已含站点名），如 "All Retro Games — Play Online Free | RetroVault" */
  title?: MaybeRefOrGetter<string>
  /** description，将自动截断至 158 字符 */
  description?: MaybeRefOrGetter<string>
  /** og:type，默认 'website'，详情页用 'video.game'，新闻用 'article' */
  ogType?: MaybeRefOrGetter<string>
}

export function usePageSeo(opts: MaybeRefOrGetter<PageSeoOptions>) {
  const route = useRoute()
  const { t, locale } = useAppI18n()
  const tagline = t('seo.tagline')
  const siteName = 'RetroVault'

  const cleanPath = computed(() => {
    const path = route.fullPath
    return path.replace(/^\/zh/, '') || '/'
  })

  const ogLocaleMap: Record<string, string> = { en: 'en_US', zh: 'zh_CN' }

  const resolved = computed(() => {
    const o = toValue(opts)
    const title = toValue(o.title) || tagline
    return {
      title,
      description: formatDescription(toValue(o.description) || tagline, 158),
      ogType: toValue(o.ogType) || 'website',
    }
  })

  useHead({
    title: computed(() => resolved.value.title),
    meta: computed(() => [
      { name: 'description', content: resolved.value.description },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: resolved.value.title },
      { name: 'twitter:description', content: resolved.value.description },
      { property: 'og:site_name', content: siteName },
      { property: 'og:title', content: resolved.value.title },
      { property: 'og:description', content: resolved.value.description },
      { property: 'og:type', content: resolved.value.ogType },
      { property: 'og:locale', content: ogLocaleMap[locale.value] || 'en_US' },
    ]),
    link: computed(() => [
      { rel: 'alternate', hreflang: 'en', href: `https://retrovault.cc${cleanPath.value}` },
      { rel: 'alternate', hreflang: 'zh', href: `https://retrovault.cc/zh${cleanPath.value}` },
      { rel: 'alternate', hreflang: 'x-default', href: `https://retrovault.cc${cleanPath.value}` },
    ]),
  })

  defineOgImage('AppOgImage' as any, () => ({
    title: resolved.value.title,
    description: resolved.value.description,
    type: resolved.value.ogType,
  }))
}
