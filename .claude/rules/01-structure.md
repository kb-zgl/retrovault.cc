# Directory Structure

```
├── pages/                    # File-based routes
│   ├── index.vue             # Homepage
│   └── games/
│       ├── index.vue         # Game list
│       └── [slug].vue        # Game detail (Phase 1)
├── components/
│   ├── layout/               # AppHeader, AppFooter, AppSidebar, etc.
│   ├── ui/                   # BaseButton, BaseInput, BaseBadge, etc.
│   └── game/                 # GameCard, GameEmulator, GameFAB (Phase 1+)
├── composables/              # useTheme, useApi, useGameQueue, etc.
├── server/
│   ├── api/games/            # API routes
│   │   ├── index.get.ts      # GET /api/games
│   │   └── [slug].get.ts     # GET /api/games/:slug
│   └── utils/games.ts        # loadGameList(), DATA_DIR
├── assets/css/
│   ├── main.css              # Design tokens + all component styles
│   └── markdown.css          # Content styles
├── types/game.ts             # GameData types (Phase 1)
├── public/
│   ├── roms/ → symlink to retrovault-scraper/data/roms/
│   └── covers/ → symlink to retrovault-scraper/data/covers/
├── retrovault-scraper/       # Scraper tool (data source)
│   └── data/
│       ├── games/*.json      # 2324 individual game files
│       ├── game_list.json    # Game list index
│       ├── all_games.json    # Summary stats
│       └── ejs_config.json   # EmulatorJS core mapping (1061 games)
├── docs/
│   ├── sub/PRD.md            # Product requirements
│   ├── pixel-arcade-ui-style-guide.md
│   ├── pixel-arcade-v3.html  # Visual demo
│   └── tasks/                # Task phase documents
└── .claude/rules/            # Claude Code rules (this directory)
```

## Naming Convention

```
Pages:       kebab-case  → /games/[slug].vue
Components:  PascalCase  → GameCard.vue, GameEmulator.vue
Composables: useXxx      → useGameQueue, useGameEngine
API routes:  kebab-case  → [slug].get.ts, index.get.ts
CSS classes: kebab-case  → .game-card, .fab-btn, .game-card-mini
CSS tokens:  --color-xxx → --color-accent, --color-bg-base
```
