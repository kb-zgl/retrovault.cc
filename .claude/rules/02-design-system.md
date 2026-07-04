# Design System

Matching `docs/pixel-arcade-v3.html`. Pink (#e02d7a) accent on deep purple-black (#0d0b12) background. Retro-futurism arcade style.

## Colors

| Token | Dark | Light | Usage |
|-------|------|-------|-------|
| `--color-bg-base` | `#0d0b12` | `#f5f3f7` | Page bg |
| `--color-bg-surface` | `#1a1722` | `#ffffff` | Cards, containers |
| `--color-bg-elevated` | `#221f2c` | `#f0eef4` | Nav, filter bars |
| `--color-accent` | `#e02d7a` | — | Primary CTA, pink |
| `--color-success` | `#2dd97a` | — | Play buttons, green |
| `--color-warning` | `#f0b028` | — | Queue buttons, yellow |
| `--color-accent-secondary` | `#2db8d9` | — | Secondary CTA, cyan |
| `--color-border` | `#2e2a38` | `#dcd8e4` | Borders |
| `--color-text-primary` | `#ede8f5` | `#1a1722` | Headings |
| `--color-text-secondary` | `#9e97ad` | `#4a4560` | Body text |

## Typography

```
--font-pixel: 'Press Start 2P', monospace;   /* headings, nav, buttons */
--font-sans:  'Inter', -apple-system, sans-serif;
--font-body:  'Inter', -apple-system, sans-serif;
--font-mono:  'JetBrains Mono', 'Fira Code', monospace;
```

- Pixel font only for headings/nav/buttons — **never for body text**
- Body min 12px (clamp)

## Radius

```
--radius-sm: 10px   --radius-md: 16px   --radius-lg: 24px   --radius-xl: 30px
```

## Key Component Classes

All defined in `assets/css/main.css`. Key classes:
- `.card` — Generic card, hover = pink border
- `.badge-pink` `.badge-green` `.badge-yellow` — Colored badges
- `.btn-pixel` `.btn-pixel-green` `.btn-pixel-pink` — Pixel font buttons
- `.pixel-nav .nav-btn` — Top navigation
- `.scroll-row` — Horizontal scroll container
- `.game-card-mini` — Small game card in scroll rows
- `.game-list-full .game-card` — Full game grid card
- `.category-grid .category-card` — Category cards
- `.filter-bar .filter-btn` — Filter buttons
- `.tag-cloud .tag-item` — Tag cloud items
- `.hero-enter` — Homepage hero
- `.fab-btn` — Floating action button (3 states: idle/playing/paused)
- `.game-float-window` — Floating game window
- `.game-float-header` — Draggable window header
- `.detail-header .detail-icon .detail-desc` — Game detail layout
- `.comment-section .cmt-form` — Comments
- `.login-modal` — Login overlay
- `body::after` — CRT scanline overlay (mix-blend-mode: overlay)

## Animations

- `@keyframes fadeIn` — Page transitions (200ms)
- `@keyframes blink` — Marquee lamps, status dots (1.2s)
- `@keyframes float` — Hero icon (2s ease-in-out)
- `@keyframes shimmer` — Skeleton loading (1.6s)
- Page transitions: `.page-enter-active` (fadeIn 200ms)
