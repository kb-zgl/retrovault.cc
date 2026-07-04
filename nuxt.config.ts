export default defineNuxtConfig({
  modules: ['@nuxt/content', '@nuxtjs/seo'],

  site: {
    url: 'https://example.com',
    name: 'Nuxt Starter',
  },

  css: ['~/assets/css/main.css', '~/assets/css/markdown.css'],

  compatibilityDate: '2026-05-07',

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

  postcss: {
    plugins: {
      '@tailwindcss/postcss': {},
    },
  },
})
