import type { MaybeRefOrGetter } from 'vue'

const SITE_NAME = 'RetroVault'
const DESC_SEPARATOR = ' — '
const TITLE_SEPARATOR = ' | '

function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  return text.slice(0, max - 1).trimEnd() + '…'
}

function formatDescription(text: string, max = 158): string {
  return truncate(text.replace(/\s+/g, ' ').trim(), max)
}

interface PageSeoOptions {
  title?: string
  description?: string
  descMax?: number
  template?: 'default' | 'category' | 'detail' | 'blog' | 'prefix'
  category?: string
  subtitle?: string
}

function buildTitle(opts: PageSeoOptions, tagline: string): string {
  const t = opts.title || tagline
  switch (opts.template) {
    case 'category':
      return `Best ${opts.category || t}${TITLE_SEPARATOR}${SITE_NAME}`
    case 'detail':
      const shortTag = opts.subtitle ? truncate(opts.subtitle, 60 - t.length - 4 - SITE_NAME.length) : ''
      return `${t}${shortTag ? DESC_SEPARATOR + shortTag : ''}${TITLE_SEPARATOR}${SITE_NAME}`
    case 'blog':
      return `${t}${TITLE_SEPARATOR}${SITE_NAME} Blog`
    case 'prefix':
      return `${t}${TITLE_SEPARATOR}${SITE_NAME}`
    default:
      return `${SITE_NAME}${DESC_SEPARATOR}${tagline}`
  }
}

function buildDescription(opts: PageSeoOptions, tagline: string): string {
  return formatDescription(
    opts.description || tagline,
    opts.descMax ?? 158,
  )
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function usePageSeo(opts: MaybeRefOrGetter<PageSeoOptions>) {
  const route = useRoute()
  const { t, locale } = useAppI18n()
  const tagline = t('seo.tagline')

  // Get clean path without /zh prefix for hreflang
  const cleanPath = computed(() => {
    const path = route.fullPath
    return path.replace(/^\/zh/, '') || '/'
  })

  const ogLocaleMap: Record<string, string> = { en: 'en_US', zh: 'zh_CN' }

  const resolved = computed(() => {
    const o = toValue(opts)
    return {
      title: buildTitle(o, tagline),
      description: buildDescription(o, tagline),
      ogTitle: o.title || tagline,
      ogDescription: o.description || tagline,
      ogType: t(`seo.ogType${capitalize(o.template || 'default')}` as any),
    }
  })

  useHead({
    title: computed(() => resolved.value.title),
    meta: computed(() => [
      { name: 'description', content: resolved.value.description },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: resolved.value.title },
      { name: 'twitter:description', content: resolved.value.description },
      { property: 'og:title', content: resolved.value.title },
      { property: 'og:description', content: resolved.value.description },
      { property: 'og:locale', content: ogLocaleMap[locale.value] || 'en_US' },
    ]),
    link: computed(() => [
      { rel: 'alternate', hreflang: 'en', href: `https://retrovault.cc${cleanPath.value}` },
      { rel: 'alternate', hreflang: 'zh', href: `https://retrovault.cc/zh${cleanPath.value}` },
      { rel: 'alternate', hreflang: 'x-default', href: `https://retrovault.cc${cleanPath.value}` },
    ]),
  })

  defineOgImage('AppOgImage', () => ({
    title: resolved.value.ogTitle,
    description: resolved.value.ogDescription,
    type: resolved.value.ogType,
  }))
}
