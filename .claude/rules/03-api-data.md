# API & Data Model

## API Endpoints

| Route | Method | Returns |
|-------|--------|---------|
| `/api/games` | GET | Game list (paginated, filterable) |
| `/api/games/:slug` | GET | Single game full data |

### Query params for `/api/games`
- `?platform=nes` — Filter by platform
- `?genre=platformer` — Filter by genre
- `?page=2&limit=48` — Pagination (max limit 200)

## Game Data Model

```typescript
interface GameData {
  id: string              // slug
  slug: string
  title: string
  platform: string        // "NES", "Game Boy Advance", "Arcade"...
  year: number
  genre: string
  developer: string
  publisher: string
  series: string
  tags: string[]
  imageUrl: string        // Remote URL
  localCover: string      // "covers/xxx.webp"
  defaultRom: string      // "roms/nes/xxx.nes"
  ejs: {
    core: string          // "nes" | "gba" | "snes" | "arcade" | "n64" | "genesis"...
    biosUrl: string
  }
  description: string
  longDescription: string[]
  controls: Record<string, string>  // { "D-Pad": "Move", "A": "Jump" }
}
```

All game data comes from `retrovault-scraper/data/` — 2324 games with individual JSON files.

## Static Files

| Path | Source | Purpose |
|------|--------|---------|
| `/roms/{platform}/{slug}.ext` | symlink → `retrovault-scraper/data/roms/` | EmulatorJS ROM loading |
| `/covers/{slug}.webp` | symlink → `retrovault-scraper/data/covers/` | Game cover images |

## EmulatorJS

- CDN: `https://cdn.emulatorjs.org/stable/data/loader.js`
- Core: from `game.ejs.core` field
- ROM URL: `/${game.defaultRom}`
- EJS config options: `EJS_player`, `EJS_core`, `EJS_gameUrl`, `EJS_biosUrl`, `EJS_pathtodata`
