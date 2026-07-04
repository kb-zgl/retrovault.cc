# Nuxt Cloudflare Starter

Production-ready boilerplate for building SaaS, directories, and content sites with Nuxt 4 and Cloudflare.

## Features

- **Nuxt 4** — SSG + ISR hybrid rendering
- **Tailwind CSS v4** — utility-first, zero-config
- **Dark/Light Mode** — CSS variable system, persisted preference
- **UI Components** — Button, Input, Select, Badge, Tag, Toast, Skeleton
- **Layout System** — Responsive header, sidebar, footer, mobile tab bar
- **SEO Ready** — usePageSeo composable, OG image generation, sitemap
- **Cloudflare Native** — Pages + Workers (Nitro), D1/KV/R2 ready
- **Nuxt Content v3** — Markdown content with queryCollection API

## Quick Start

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Build for production
pnpm build

# Type check
pnpm typecheck
```

## Customize

1. `nuxt.config.ts` — site URL, name
2. `composables/usePageSeo.ts` — default SEO values
3. `assets/css/main.css` — colors, fonts, design tokens
4. Replace `pages/index.vue` with your own page

## Deploy to Cloudflare

```bash
pnpm build
wrangler deploy
```

## License

MIT
