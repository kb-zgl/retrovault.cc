# Nuxt Cloudflare Starter

Production-ready Nuxt 4 boilerplate with Cloudflare deployment.

## Stack

| Layer | Tech |
|-------|------|
| Framework | Nuxt 4 (SSG + ISR) |
| Styling | Tailwind CSS v4 |
| Content | Nuxt Content v3 |
| SEO | @nuxtjs/seo (sitemap, robots, OG image) |
| Deployment | Cloudflare Pages + Workers (Nitro) |
| Theme | CSS variables, dark/light mode |

## Directory Structure

```
├── pages/              # File-based routes
├── components/
│   ├── layout/         # AppHeader, AppSidebar, AppFooter, ThemeToggle, MobileTabBar
│   ├── ui/             # BaseButton, BaseInput, BaseSelect, BaseBadge, BaseTag, BaseToast, BaseSkeleton
│   └── og/             # AppOgImage (OG image template)
├── composables/        # useTheme, usePageSeo, useApi, useAuth, useToast, useKeyboardShortcuts
├── assets/css/         # main.css (design tokens), markdown.css
├── types/              # TypeScript type definitions
├── content/            # Nuxt Content markdown files
├── public/             # Static assets (favicon, manifest)
├── nuxt.config.ts
├── wrangler.toml       # Cloudflare deployment template
└── package.json
```

## Quick Start

```bash
pnpm dev          # Start dev server
pnpm build        # Build for production
pnpm typecheck    # Type check
```

## Customization

1. Update `nuxt.config.ts` — site name, URL
2. Update `composables/usePageSeo.ts` — SITE_NAME, TAGLINE
3. Modify `assets/css/main.css` — colors, fonts, design tokens
4. Replace `pages/index.vue` with your own content

## Design System

The `assets/css/main.css` defines design tokens matching `docs/pixel-arcade-v3.html`:

- **Dark mode (default)**: deep purple-black bg (#0d0b12), light text (#ede8f5)
- **Accent**: Pink (#e02d7a) — primary CTA, active states, highlights
- **Green (success)**: #2dd97a — play buttons, running indicators
- **Yellow (warning)**: #f0b028 — queue buttons, paused state
- **Cyan (secondary)**: #2db8d9 — secondary CTA
- **Fonts**: Inter (body/headings), JetBrains Mono (code), Press Start 2P (pixel/titles)
- **Radius**: Extra large (10/16/24/30px) for retro feel
- **Cards**: bg-elevated (#221f2c), border, hover = pink border tint, active = scale(0.95)
- **CRT overlay**: `body::after` scanline pattern (mix-blend-mode: overlay)
- **Theme**: persisted in localStorage (`app-theme`). Toggle via `useTheme()` composable. Light mode minimal.

## Cloudflare

The `wrangler.toml` is pre-configured for Cloudflare Pages deployment with Nitro preset `cloudflare_module`. Uncomment D1/KV/R2 sections as needed.
