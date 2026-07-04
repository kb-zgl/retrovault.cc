# RetroVault · Claude Code Guide

Classic retro game emulator platform. Nuxt 4, Tailwind CSS v4, Cloudflare.

## Quick Links

- **Stack** → @.claude/rules/00-stack.md
- **Directory + Naming** → @.claude/rules/01-structure.md
- **Design System** → @.claude/rules/02-design-system.md
- **API & Data Model** → @.claude/rules/03-api-data.md
- **Tasks & Phases** → @.claude/rules/04-tasks.md

## Core Commands

```bash
pnpm dev          # Start dev server
pnpm build        # Build for Cloudflare
pnpm typecheck    # Type check
```

## Key Files

| What | Where |
|------|-------|
| PRD | `docs/sub/PRD.md` |
| Style guide | `docs/pixel-arcade-ui-style-guide.md` |
| Visual demo | `docs/pixel-arcade-v3.html` |
| Task phases | `docs/tasks/README.md` |
| Main CSS | `assets/css/main.css` |
| Nuxt config | `nuxt.config.ts` |
| Scraper data | `retrovault-scraper/data/` |

## Design Philosophy

- Retro-modern fusion: pixel accents on clean dark layout
- Mobile-first, touch-native (min 44px targets)
- Dark immersive theme (like dimly lit arcade)
- Pink (#e02d7a) accent on deep purple-black (#0d0b12) bg
- CRT scanline overlay via `body::after`
- Cards use borders not shadows; hover = pink border tint

## Data Flow

```
retrovault-scraper/data/games/*.json
  → server/api/games/[slug].get.ts
    → pages/games/[slug].vue
      → GameEmulator.vue (EmulatorJS CDN + ROM from /roms/)
```

All 2324 games available via `GET /api/games` and `GET /api/games/:slug`.

## Development Pattern

1. Start with `pnpm dev`
2. Check `@.claude/rules/02-design-system.md` for component classes
3. All styles in `assets/css/main.css` — no inline Tailwind unless necessary
4. Use existing composables (`useApi`, `useToast`, `useTheme`) before creating new ones
5. Game-specific components go in `components/game/`
