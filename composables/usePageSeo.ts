import type { MaybeRefOrGetter } from 'vue'

const SITE_NAME = 'My App'
const TAGLINE = 'Build something great'
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

function buildTitle(opts: PageSeoOptions): string {
  const t = opts.title || TAGLINE
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
      return `${SITE_NAME}${DESC_SEPARATOR}${TAGLINE}`
  }
}

function buildDescription(opts: PageSeoOptions): string {
  return formatDescription(
    opts.description || TAGLINE,
    opts.descMax ?? 158,
  )
}

const OG_TYPE_LABEL: Record<string, string> = {
  default: 'Home',
  category: 'Category',
  detail: 'Detail',
  blog: 'Blog',
  prefix: 'Page',
}

export function usePageSeo(opts: MaybeRefOrGetter<PageSeoOptions>) {
  const resolved = computed(() => {
    const o = toValue(opts)
    return {
      title: buildTitle(o),
      description: buildDescription(o),
      ogTitle: o.title || TAGLINE,
      ogDescription: o.description || TAGLINE,
      ogType: OG_TYPE_LABEL[o.template || 'default'] || 'Page',
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
    ]),
  })

  defineOgImage('AppOgImage', () => ({
    title: resolved.value.ogTitle,
    description: resolved.value.ogDescription,
    type: resolved.value.ogType,
  }))
}
