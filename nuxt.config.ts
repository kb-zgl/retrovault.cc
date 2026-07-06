export default defineNuxtConfig({
  modules: ['@nuxt/content', '@nuxtjs/seo'],

  site: {
    url: 'https://retrovault.cc',
    name: 'RetroVault',
  },

  css: ['~/assets/css/main.css', '~/assets/css/markdown.css'],

  compatibilityDate: '2026-05-07',

  hooks: {
    'pages:extend'(pages) {
      // Duplicate all user-facing pages with /zh prefix for Chinese locale
      const zhPages = pages
        .filter(p => !p.path.startsWith('/api/'))
        .map(p => ({
          ...p,
          path: `/zh${p.path === '/' ? '' : p.path}`,
          name: p.name ? `${p.name}-zh` : undefined,
        }))
      pages.push(...zhPages)
    },
  },


  components: [
    {
      path: '~/components',
      pathPrefix: false
    }
  ],

  nitro: {
    preset: 'cloudflare_module',
    cloudflare: {
      nodeCompat: true,
    }
  },

  runtimeConfig: {
    apiBase: '',
  },

  content: {},

  ogImage: {
    enabled: true,
    runtimeCacheStorage: false
  },

  robots: {
    allow: ['/'],
  },

  sitemap: {
    autoLastmod: true,
  },

  routeRules: {
    '/admin/**': { ssr: false },
  },

  postcss: {
    plugins: {
      '@tailwindcss/postcss': {},
    },
  },
})
