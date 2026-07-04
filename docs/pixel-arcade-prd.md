# Pixel Arcade · Product Requirements Document

> Status: Finalized  
> Stack: Nuxt 4 / Cloudflare / D1  
> Target: Web (Mobile-First), 2000+ online arcade games

---

## 1. Product Overview

Pixel Arcade is a browser-based retro gaming platform. Users can browse, instantly play, and manage a library of 2000+ arcade games. No download, no signup required.

**Core value proposition:**
- New users: discover and play a game in < 3 taps
- Returning users: continue where they left off instantly

---

## 2. User Personas

### 2.1 New Visitor
- No play history, no queue
- Needs immediate value demonstration
- Wants to try something fast without commitment

### 2.2 Returning Player
- Has play history and/or queue
- Wants to resume or switch between games quickly
- Values progress persistence

---

## 3. Core User Flows

### 3.1 Discovery → Play
```
Browse Home / Categories / List → See game card → Tap ▶ on card → Fullscreen game starts
```

### 3.2 Quick Switch (FAB)
```
Tap FAB → Cover panel opens → Tap game cover → Current game saves, new game loads
```

### 3.3 Queue Management
```
Tap + on any card → Added to queue → FAB panel shows queued games
Play from queue → Game rotates to back of queue after play
```

### 3.4 Continue Playing
```
Return to site → Hero shows "Continue" with last played game → Tap → Resume
Or: Home section "Continue Playing" shows recent 6 games
```

---

## 4. Feature Specifications

### 4.1 Home Page

#### 4.1.1 Hero (Dual State)

| State | Trigger | Layout |
|-------|---------|--------|
| **New User** | `userGameHistory.length === 0` | Large welcome block with 3 CTAs (Play Random / Popular / Browse All) + Trending chips |
| **Returning User** | `userGameHistory.length > 0` | Compact bar showing last played game + Continue & Random buttons |

#### 4.1.2 Home Sections (in order)

1. **Continue Playing** (visible only if history exists) — last 6 played games, horizontal scroll
2. **Your Queue** (visible only if queue non-empty) — first 6 queued games, horizontal scroll
3. **Featured** — editor-curated selection
4. **Emulators** — browse by platform
5. **Developers** — browse by developer

### 4.2 Game Cards

Every game card (home scroll, list grid) includes:
- **Cover image** (square, rounded corners, placeholder emoji for now)
- **▶ Play button** (green, top-right) — instant launch, bypasses detail page
- **+ Queue button** (yellow/green toggle, top-right next to play) — add/remove from queue
- **Title + subtitle** (year or category)
- Tap card body → opens detail page

### 4.3 Game Detail Page

- Large cover image (130-180px)
- Title, category, year, tags
- Description text
- **Play Now** button (fullscreen launch)
- **Add/Remove Queue** button
- Comments section (localStorage-based for prototype)

### 4.4 Fullscreen Game Mode

- Triggered by: Play button, FAB cover tap, F key
- Canvas fills viewport, semi-transparent backdrop
- Top bar: game name + score + pause/resume + fullscreen toggle + close
- Keyboard: arrow keys for direction, space for pause
- Game: Snake (placeholder for prototype; real games via WebAssembly/iframe)

### 4.5 FAB (Floating Action Button)

| State | Icon | Behavior |
|-------|------|----------|
| No game running | 🎮 (pink) | Tap to open cover panel |
| Game running | ⏸ (green) + score badge | Tap to pause/resume |
| Game paused | ▶ (yellow) | Tap to resume |

#### FAB Panel (cover-based)
- Opens on FAB tap when no game is running
- Shows 5 game covers (square, rounded) in a row:
  - Current/running game (green border + score)
  - Recent history (up to 4)
  - Queue fill (if history < 4)
  - Random fill (if still < 5)
- Bottom row: Random button, Queue (next) button, History button
- Tap cover → save current progress → load selected game
- Tap backdrop → close panel

### 4.6 Queue System

- **Add**: + button on any card or detail page
- **Remove**: tap again (toggles)
- **Consume**: FAB "Queue" button or "Queue" section "Manage" → takes first, rotates to back
- **Display**: home "Your Queue" section, FAB panel covers, card button state
- Data: `playQueue` array in localStorage → future D1 table

### 4.7 User Game History

Data collected per game session:
```json
{
  "gameId": 3,
  "lastPlayedAt": 1720000000,
  "totalPlayTime": 320,
  "highScore": 42,
  "playCount": 5,
  "completed": false
}
```

Used for:
- Home "Continue Playing" section
- FAB panel cover suggestions
- Future: recommendations, user profile

### 4.8 Game Progress Saves

Per-game save state (snake position, score, etc.) stored in `gameSaves` object.

**Save trigger:**
- Switching games (FAB cover tap, queue consume, card play)
- Pausing
- Game over
- Closing/minimizing game window
- Every direction change (auto-save for snake)

**Load trigger:**
- Starting a previously played game

---

## 5. Data Architecture

### 5.1 Local Storage Schema

| Key | Type | Description |
|-----|------|-------------|
| `userGameHistory` | Array | Play history, max 50 entries |
| `gameSaves` | Object | Per-game save states, keyed by gameId |
| `playQueue` | Array | Ordered game IDs |
| `snakeHighScore` | Number | Global high score (legacy) |
| `currentGameId` | Number | Last active game |
| `pixelUser` | String | Logged-in username |
| `gameComments_{id}` | Array | Comments per game |
| `guestbookMessages` | Array | Guestbook entries |

### 5.2 Future Backend Migration

All user-facing data uses flat JSON structures designed for direct migration to:
- **Cloudflare D1** (SQLite): `user_history`, `game_saves`, `play_queue`, `comments` tables
- **Cloudflare KV**: session tokens, rate limiting
- **Sync flow**: login → fetch remote → merge with local → periodic background sync

---

## 6. Multi-Language Support

### 6.1 Strategy
- All UI strings externalized (prepare for i18n keys)
- Current prototype: English only
- Future: i18n keys → JSON locale files → Nuxt i18n module

### 6.2 Content
- Game metadata (title, description, tags) stored per locale
- Proposed D1 schema: `games` table with `title_en`, `title_zh`, `desc_en`, `desc_zh` columns

---

## 7. Non-Functional Requirements

- **Mobile-First**: all interactions designed for touch, 375px minimum width
- **Performance**: initial load < 2s, game start < 500ms
- **Offline-tolerant**: localStorage for all user data, sync when online
- **Accessibility**: minimum touch target 44px, readable font sizes (≥12px mobile)

---

## 8. Future Roadmap (Out of Current Scope)

- User account system with remote save sync
- Game recommendation engine based on play history
- Social features (leaderboards, friend challenges)
- Game upload/embed system for community contributions
- PWA with offline game cache