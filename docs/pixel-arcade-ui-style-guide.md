# Pixel Arcade · UI-UX Style Guide

> Methodology: UI-UX-Pro-Max  
> Version: 3.0  
> Status: 同步 pixel-arcade-v3.html·Pink 色板定稿

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

**Switch to dark-only with light-mode compatibility. Pink accent palette from pixel-arcade-v3.html.**

Token 命名与 main.css 的 Tailwind v4 `@theme` 变量体系统一。

#### Backgrounds
| Tailwind Token | 暗色值 | 亮色值 | Usage |
|----------------|--------|--------|-------|
| `--color-bg-base` | `#0d0b12` | `#f5f3f7` | Page background |
| `--color-bg-surface` | `#1a1722` | `#ffffff` | Main container, cards |
| `--color-bg-elevated` | `#221f2c` | `#f0eef4` | Elevated surfaces, inputs |
| `--color-header-bg` | `rgba(13,11,18,0.92)` | — | Header |

#### Accents
| Tailwind Token | Value | Usage |
|----------------|-------|-------|
| `--color-accent` | `#e02d7a` | Primary CTA, active nav, highlights |
| `--color-success` | `#2dd97a` | Play button, running indicator |
| `--color-warning` | `#f0b028` | Queue button, paused state |
| `--color-danger` | `#ef4444` | Errors |
| `--color-accent-secondary` | `#2db8d9` | Secondary CTA |

#### Text
| Tailwind Token | 暗色值 | 亮色值 | Usage |
|----------------|--------|--------|-------|
| `--color-text-primary` | `#ede8f5` | `#1a1722` | Headings, important text |
| `--color-text-secondary` | `#9e97ad` | `#4a4560` | Body text, descriptions |
| `--color-text-muted` | `#6e687a` | `#8a8498` | Metadata, labels |

#### Borders
| Tailwind Token | 暗色值 | 亮色值 | Usage |
|----------------|--------|--------|-------|
| `--color-border` | `#2e2a38` | `#dcd8e4` | All borders, dividers |
| `--color-border-hover` | `#3f3a4e` | `#c8c2d4` | Hover state |
| `--color-border-active` | `#e02d7a` | `#e02d7a` | Active/focus |

### 2.2 Typography

#### Font Stack
```css
/* 在 main.css 中 */
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

--font-pixel: 'Press Start 2P', monospace;
--font-sans:  'Inter', -apple-system, sans-serif;
--font-body:  'Inter', -apple-system, sans-serif;
--font-mono:  'JetBrains Mono', 'Fira Code', monospace;
```

#### Usage Rules
| Element | Font | Min Size (Mobile) | Max Size (Desktop) |
|---------|------|-------------------|---------------------|
| Headings (section titles, hero) | Pixel | 11px | 15px |
| Navigation buttons | Pixel | 10px | 13px |
| Game titles (cards) | Pixel | 10px | 12px |
| Card subtitles, metadata | Body | **clamp(11px, 1.5vw, 13px)** | |
| Body text (descriptions, comments) | Body | **clamp(12px, 2vw, 14px)** | |
| Buttons (pixel) | Pixel | 10px | 12px |
| Footer, labels | Body | **clamp(11px, 1.5vw, 13px)** | |

**规则：**
- Pixel 字体最小 10px（低于此值像素笔画不可读）
- 正文最小 **12px**（10px 在手机上会导致用户手动缩放，不符合 WCAG）
- 所有字体大小使用 `clamp()` 流体缩放
- Pixel 字体只用于标题/导航/按钮，**不用于正文**（anti-pattern）

### 2.3 Spacing & Radius

与现有 `main.css` Tailwind v4 `@theme` 半径体系统一。

| Token | 旧值 (starter) | 新值 (匹配 demo) | Usage |
|-------|---------------|-------------------|-------|
| `--radius-sm` | 4px | **10px** | Cover images, inputs |
| `--radius-md` | 6px | **16px** | Cards, panels |
| `--radius-lg` | 10px | **24px** | Buttons, containers, badges |
| `--radius-xl` | 14px | **30px** | Hero section, modals |
| `--radius-full` | 9999px | 9999px | Pills, tags |
| Card gap | — | 14-16px mobile, 18-22px desktop | Grid/list spacing |
| Section margin | — | 24px | Between home sections |
| Page padding | — | 12px mobile, 28-36px desktop | Body padding |

### 2.4 Shadows & Elevation

| Level | Usage | Value |
|-------|-------|-------|
| 1 (Cards) | Game cards, list items | `none`（border-only `var(--color-border)`） |
| 2 (FAB) | Floating button | `0 6px 24px rgba(0,0,0,0.5)` |
| 3 (Panel) | FAB panel, modals | `0 8px 36px rgba(0,0,0,0.6)` |
| 4 (Container) | Main cabinet | `0 8px 40px rgba(0,0,0,0.5)` |

**规则：**
- 小卡片**无阴影**，用 1px 边框分离层次
- 保留阴影给浮动元素（FAB、面板、模态框）
- 卡片 hover 时仅变边框色，不加阴影弹起

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
- Color contrast: text-primary on bg-base dark = 12.5:1 (AAA)
- Focus indicators: border-color change to `--color-accent` pink on interactive elements
- Font sizes: pixel font min **10px**, body font min **12px** (WCAG 1.4.4 — text resizing)
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
- ❌ Emoji as structural icons (use SVG: Heroicons, Lucide)
- ❌ CRT scanline/glitch as permanent overlay（仅装饰性使用，不可影响可读性）

### 7.3 装饰效果（可选，非 MVP）
以下 Retro-Futurism 装饰效果属于 UI/UX Pro Max 推荐但 MVP 阶段暂不实现：
- CRT scanline overlay（`::before` 线条叠加）
- Neon glow（`text-shadow` + `box-shadow` 霓虹辉光）
- Glitch 文字特效（skew/offset 关键帧动画）

---

## 8. Changelog

| Version | Date | Changes |
|---------|------|---------|
| 3.0 | 2026-07-04 | 同步 pixel-arcade-v3.html 设计定稿。Pink (#e02d7a) + 深紫黑 (#0d0b12) 正式色板。全部组件 CSS 匹配 demo（卡片/导航/筛选/FAB/浮动窗口/留言板/登录等）。CRT 扫描线叠加。大圆角 10/16/24px。 |
| 2.0 | 2026-07-04 | 统一 Token 命名 Tailwind v4 @theme。字体大小修正（body ≥12px）。半径放大。卡片无阴影。 |
| 1.0 | 2026-07-03 | Initial style guide. Hero dual-state, FAB cover panel, fullscreen game, queue system, responsive tokens. |