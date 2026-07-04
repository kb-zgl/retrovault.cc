# Pixel Arcade · UI-UX Style Guide

> Methodology: UI-UX-Pro-Max  
> Version: 1.0  
> Status: Finalized

---

## 1. Design Philosophy

### 1.1 Core Principles

| Principle | Manifestation |
|-----------|---------------|
| **Retro-modern fusion** | Pixel font accents on a clean, dark, modern layout |
| **Mobile-first, touch-native** | Every interaction designed for thumb reach; minimum 44px touch targets |
| **Progressive disclosure** | New users see guidance; returning users see their content first |
| **Zero-learning-curve play** | ▶ button on every card = instant game start, no detail page required |
| **Quiet by default, vibrant on interaction** | Muted palette with neon accents on hover/active states |

### 1.2 Emotional Tone

- Nostalgic but not kitschy
- Playful but not childish
- Dark and immersive, like a dimly lit arcade at night

---

## 2. Design Tokens

### 2.1 Color System

#### Backgrounds
| Token | Value | Usage |
|-------|-------|-------|
| `--bg-deep` | `#0d0b12` | Page background |
| `--bg-card` | `#1a1722` | Main container, cards |
| `--bg-surface` | `#221f2c` | Elevated surfaces, inputs |

#### Accents
| Token | Value | Usage |
|-------|-------|-------|
| `--accent-pink` | `#e02d7a` | Primary CTA, active nav, highlights |
| `--accent-green` | `#2dd97a` | Play button, success state, running indicator |
| `--accent-yellow` | `#f0b028` | Queue button, paused state, warnings |
| `--accent-cyan` | `#2db8d9` | Secondary CTA, random button |

#### Text
| Token | Value | Usage |
|-------|-------|-------|
| `--text-primary` | `#ede8f5` | Headings, important text |
| `--text-secondary` | `#9e97ad` | Body text, descriptions |
| `--text-muted` | `#6e687a` | Metadata, labels, placeholders |

#### Borders
| Token | Value | Usage |
|-------|-------|-------|
| `--border-subtle` | `#2e2a38` | All borders, dividers |

### 2.2 Typography

#### Font Stack
```css
--font-pixel: 'Press Start 2P', monospace;
--font-body: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', Roboto, Helvetica, Arial, sans-serif;
```

#### Usage Rules
| Element | Font | Min Size (Mobile) | Max Size (Desktop) |
|---------|------|-------------------|---------------------|
| Headings (section titles, hero) | Pixel | 11px | 15px |
| Navigation buttons | Pixel | 10px | 13px |
| Game titles (cards) | Pixel | 9px | 12px |
| Card subtitles, metadata | Body | 8px | 11px |
| Body text (descriptions, comments) | Body | 10px | 12px |
| Buttons (pixel) | Pixel | 8px | 10px |
| Footer, labels | Body | 10px | 12px |

**Rule:** Pixel font minimum 10px for readability. Body font minimum 10px. All sizes use `clamp()` for fluid scaling.

### 2.3 Spacing & Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | `10px` | Cover images, inputs |
| `--radius-md` | `16px` | Cards, panels |
| `--radius-lg` | `24px` | Main container, buttons, chips |
| Card gap | `14-16px` mobile, `18-22px` desktop | Grid/list spacing |
| Section margin | `24px` | Between home sections |
| Page padding | `12px` mobile, `28-36px` desktop | Body padding |

### 2.4 Shadows & Elevation

| Level | Usage | Value |
|-------|-------|-------|
| 1 (Cards) | Game cards, list items | `none` (border-only) |
| 2 (FAB) | Floating button | `0 6px 24px rgba(0,0,0,0.5)` |
| 3 (Panel) | FAB panel, modals | `0 8px 36px rgba(0,0,0,0.6)` |
| 4 (Container) | Main cabinet | `0 8px 40px rgba(0,0,0,0.5)` |

**Rule:** No heavy shadows on small cards. Use 1px borders for separation. Reserve shadows for floating elements.

---

## 3. Component Specifications

### 3.1 Hero Block

#### State: New User
```
┌─────────────────────────────────┐
│         🕹️ (animated)          │
│   Welcome to Pixel Arcade       │
│   2000+ retro games in browser  │
│                                 │
│  [🎲 Play Random] [🔥 Popular] │
│  [📂 Browse All]                │
│                                 │
│  🔥 Trending now                │
│  [👾 SPACE BLAST] [🐉 DRAGON]  │
└─────────────────────────────────┘
```
- Background: gradient `bg-surface → #2a1f30`
- 3 CTA buttons in flex row, pink / cyan / outline styles
- Trending chips: rounded pills, tap → go to detail

#### State: Returning User
```
┌─────────────────────────────────┐
│ 🐉 │ DRAGON QUEST              │
│    │ Last played · HS: 42      │
│    │            [▶ Continue] [🎲]│
└─────────────────────────────────┘
```
- Compact horizontal bar
- Tap anywhere → continue last game
- Explicit Continue + Random buttons on right

### 3.2 Game Card

```
┌──────────────┐
│ [▶]  [+]     │  ← Play (green circle) + Queue (yellow circle)
│              │
│   ┌──────┐   │
│   │ COVER │   │  ← Square, rounded, aspect-ratio 1/1
│   └──────┘   │
│              │
│  GAME TITLE  │  ← Pixel font, 1-2 lines
│   category   │  ← Body font, muted
│  [Tag]       │  ← Rounded pill
└──────────────┘
```

**Dimensions:**
- Mobile card: min 140px wide, cover area ~80-90px
- Desktop card: min 200px wide, cover area ~110-140px
- Grid: 2 cols mobile, 3 cols tablet, 4 cols desktop

**States:**
- Default: `border-subtle` border
- Hover: border → `accent-pink`
- Active: `scale(0.95)`
- Queue button: yellow default → green when in queue (`✓`)

### 3.3 FAB & Panel

#### FAB Button
```
┌────┐
│ 🎮 │  ← Pink circle, 54-66px
└────┘
  [42]   ← Score badge (only when running)
```

**States:**
| State | Color | Icon |
|-------|-------|------|
| Idle (no game) | Pink `#e02d7a` | 🎮 |
| Running | Green `#2dd97a` | ⏸ + score badge |
| Paused | Yellow `#f0b028` | ▶ |

#### FAB Panel
```
┌──────────────────────────┐
│ 🎮 Quick Switch          │
│                          │
│ [👾] [🐉] [🏎️] [🧙] [🤖]│  ← 5 cover squares (60-80px)
│  now                      │     Green border on current game
│                          │
│ [🎲 Random] [⏭ Queue] [📋 History] │
└──────────────────────────┘
```
- Opens upward from FAB
- Backdrop: semi-transparent overlay
- Tap backdrop → close
- Tap cover → save current → load selected

### 3.4 Fullscreen Game Mode

```
┌──────────────────────────┐
│ 🕹️ SPACE BLAST    [⛶][▼][✕] │  ← 48px toolbar
├──────────────────────────┤
│                          │
│                          │
│     GAME CANVAS          │  ← Fills remaining height
│     (pixelated)          │
│                          │
│                          │
├──────────────────────────┤
│ 🏆 42          Running ● │  ← Info bar
└──────────────────────────┘
```

**Triggers:**
- ▶ button on any card
- "Play Now" on detail page
- FAB cover tap
- `F` key (toggle)

**Exit:**
- ✕ button → minimize to floating window
- `F` key → toggle back to floating
- `Esc` → close completely

### 3.5 Queue Indicators

**Card queue button:**
- Position: top-right of card, next to play button
- Default: `+` on yellow circle
- In queue: `✓` on green circle
- Tap toggles queue membership

**Detail page queue button:**
- Full-width button below description
- Text: "➕ Add to Queue" / "✅ In Queue"

### 3.6 Navigation

```
┌──────────────────────────────────────┐
│ [Home] [Games] [Tags] [News] [Guestbook] [About] │
└──────────────────────────────────────┘
```
- Pill-shaped container, flex wrap
- Active state: filled pink background
- Inactive: transparent, muted text
- Min height 42px for touch

---

## 4. Interaction Patterns

### 4.1 Micro-interactions

| Trigger | Animation | Duration |
|---------|-----------|----------|
| Card tap | `scale(0.95)` | 100ms |
| Button tap | `scale(0.92-0.96)` | 80-100ms |
| Page transition | `fadeIn` (opacity + translateY 6px → 0) | 200ms |
| FAB panel open | `display: block` (no animation for simplicity) | — |
| Game over flash | Red text overlay on canvas | — |
| Marquee lamps | `blink` opacity + scale | 1.2s infinite alternate |

### 4.2 Gestures

| Gesture | Context | Action |
|---------|---------|--------|
| Tap card body | Game card | Open detail page |
| Tap ▶ button | Game card | Launch game directly |
| Tap + button | Game card | Toggle queue |
| Tap FAB | Global | Toggle panel or pause game |
| Keyboard arrows | Game running | Control direction |
| Space | Game running | Pause/resume |
| F | Game running | Toggle fullscreen |

### 4.3 Feedback

| Action | Feedback |
|--------|----------|
| Add to queue | Alert toast + button state change to ✓ |
| Remove from queue | Alert toast + button state change to + |
| Game over | Canvas overlay + score saved |
| Switch game | Instant cover swap, no loading state needed for canvas games |
| Login | Alert welcome message |
| Empty queue | Alert "Queue is empty" |

---

## 5. Responsive Breakpoints

| Breakpoint | Width | Layout Changes |
|------------|-------|----------------|
| Mobile (default) | < 600px | 2-col grids, compact cards, FAB at 54px |
| Tablet | ≥ 600px | 3-col grids, larger covers, FAB at 60px |
| Desktop | ≥ 1024px | 4-col grids, max-width 1200px container, FAB at 66px |

**All sizes use `clamp()` for fluid scaling between breakpoints.**

---

## 6. Accessibility

- Touch targets: minimum 44×44px (WCAG 2.5.5)
- Color contrast: text-primary on bg-deep = 12.5:1 (AAA)
- Focus indicators: border-color change to accent-pink on interactive elements
- Font sizes: minimum 10px for pixel font, 10px for body font (mobile)
- Reduced motion: `prefers-reduced-motion` should disable blink animations (future)

---

## 7. Visual References

### 7.1 Inspirations
- itch.io — game card grid layout
- RetroArch — dark UI with neon accents
- Arcade cabinet marquees — color palette and lamp animations

### 7.2 Anti-patterns (Do NOT)
- ❌ Heavy box-shadows on small cards (use borders)
- ❌ Pixel font for body text (unreadable at length)
- ❌ More than 3 accent colors in one view
- ❌ Auto-playing games without user intent
- ❌ Fixed bottom control panel taking screen real estate

---

## 8. Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-07-03 | Initial style guide. Hero dual-state, FAB cover panel, fullscreen game, queue system, responsive tokens. |