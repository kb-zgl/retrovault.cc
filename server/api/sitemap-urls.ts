import { defineEventHandler, getRequestProtocol, getRequestHost } from 'h3'
import { loadGameList } from '~/server/utils/games'

interface ImageEntry {
  loc: string
  title?: string
  caption?: string
}

interface SitemapEntry {
  loc: string
  lastmod?: string
  changefreq?: string
  priority?: number
  images?: ImageEntry[]
}

function platformToSlug(platform: string): string {
  const map: Record<string, string> = {
    'NES': 'nes',
    'SNES': 'snes',
    'Nintendo 64': 'n64',
    'Game Boy Advance': 'gba',
    'Game Boy': 'gb',
    'Nintendo DS': 'nds',
    'PlayStation': 'ps',
    'Genesis': 'genesis',
    'Sega Saturn': 'saturn',
    'Sega 32X': 'sega-32x',
    'Sega CD': 'sega-cd',
    'Game Gear': 'sega-game-gear',
    'Sega Master System': 'sega-master-system',
    'Virtual Boy': 'virtual-boy',
    'Atari Jaguar': 'atari-jaguar',
    'Bandai WonderSwan': 'bandai-wonderswan',
    'NeoGeo Pocket': 'neogeo-pocket',
    'PC Engine CD': 'pc-engine-cd',
    'Commodore 64': 'commodore-64',
    'ColecoVision': 'colecovision',
    'Famicom Disk System': 'nintendo-famicom',
    'MSX2': 'msx2',
  }
  return map[platform] || platform.toLowerCase().replace(/\s+/g, '-')
}

/** Extract cover filename from coverImg path, e.g. "/games/covers/nes/slug.webp" → "slug.webp" */
function coverFilename(coverImg: string): string | null {
  if (!coverImg) return null
  const parts = coverImg.split('/')
  return parts[parts.length - 1] || null
}

export default defineEventHandler(async (event) => {
  const protocol = getRequestProtocol(event)
  const host = getRequestHost(event)
  const baseUrl = `${protocol}://${host}`

  const entries: SitemapEntry[] = []

  // 1. Game detail pages (with cover images)
  const list = loadGameList()
  const games = Object.values(list.games)

  for (const game of games) {
    const entry: SitemapEntry = {
      loc: `/games/${game.slug}`,
      lastmod: list.scrapedAt,
      changefreq: 'monthly',
      priority: 0.8,
    }

    // Add cover image if available
    const filename = coverFilename(game.coverImg)
    if (filename) {
      entry.images = [
        {
          loc: `${baseUrl}/covers/${filename}`,
          title: game.title,
          caption: `Play ${game.title} online free at RetroVault`,
        },
      ]
    }

    entries.push(entry)
  }

  // 2. Platform pages (e.g. /nes-games)
  const seenPlatforms = new Set<string>()
  for (const game of games) {
    const slug = platformToSlug(game.platform)
    if (!seenPlatforms.has(slug)) {
      seenPlatforms.add(slug)
      entries.push({
        loc: `/${slug}-games`,
        changefreq: 'weekly',
        priority: 0.5,
      })
    }
  }

  // 3. Tag page
  entries.push({
    loc: '/tags',
    changefreq: 'weekly',
    priority: 0.3,
  })

  return entries
})
