export default defineNuxtConfig({
  modules: ['@nuxt/content', '@nuxtjs/seo'],

  site: {
    url: 'https://retrovault.online',
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
    },
  },

  runtimeConfig: {
    apiBase: process.env.NUXT_API_BASE || '',
    r2PublicUrl: process.env.NUXT_R2_PUBLIC_URL || 'https://cdn.retrovault.online/',
  },

  content: {},

  ogImage: {
    enabled: true,
    runtimeCacheStorage: false,
    fonts: [
      { path: '/fonts/Inter-Regular.ttf', weight: 400 },
      { path: '/fonts/Inter-Bold.ttf', weight: 700 },
    ],
  },

  robots: {
    allow: ['/'],
    disallow: ['/admin/**', '/api/**'],
  },

  sitemap: {
    autoLastmod: true,
    sources: ['/api/sitemap-urls'],
  },

  routeRules: {
    '/admin/**': { ssr: false },
  },

  postcss: {
    plugins: {
      '@tailwindcss/postcss': {},
    },
  },
	watchers: {
		chokidar: {
			ignored: /node_modules|\.git|\.nuxt|retrovault-scraper/,
		},
	},
	vite: {
		optimizeDeps: {
			include: []
		}
	}
})
