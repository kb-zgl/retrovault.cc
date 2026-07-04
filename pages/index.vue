<template>
  <div>
    <!-- Hero enter block -->
    <div class="hero-enter" @click="navigateTo('/games')">
      <span class="hero-icon">🕹️</span>
      <div class="hero-title">Explore All Games</div>
      <div class="hero-sub">— Tap to enter the pixel vault —</div>
      <div class="hero-count">📦 <span>{{ totalAll }}</span> games</div>
    </div>

    <!-- Loading skeleton -->
    <template v-if="pending">
      <div v-for="n in 3" :key="n" class="home-section">
        <div class="section-header">
          <div class="skeleton" style="width:120px;height:16px" />
        </div>
        <div class="scroll-row">
          <div v-for="m in 4" :key="m" class="game-card-mini" style="border:none;background:transparent;padding:0">
            <div class="skeleton" style="width:100%;aspect-ratio:1/1;border-radius:var(--radius-sm);margin-bottom:8px" />
            <div class="skeleton" style="width:80%;height:10px;margin:0 auto" />
          </div>
        </div>
      </div>
    </template>

    <template v-else>
      <!-- Recent games -->
      <div class="home-section">
        <div class="section-header">
          <div class="sec-title">🔄 Recent <span class="count-badge">{{ recent.length }}</span></div>
          <button class="sec-more" @click="navigateTo('/games')">View all →</button>
        </div>
        <div class="scroll-row">
          <GameCard
            v-for="g in recent"
            :key="g.slug"
            :game="g"
            @click="navigateTo(`/games/${g.slug}`)"
            @play="navigateTo(`/games/${g.slug}`)"
          />
        </div>
      </div>

      <!-- Featured -->
      <div class="home-section">
        <div class="section-header">
          <div class="sec-title">⭐ Featured <span class="count-badge">{{ featured.length }}</span></div>
          <button class="sec-more" @click="navigateTo('/games')">View all →</button>
        </div>
        <div class="scroll-row">
          <GameCard
            v-for="g in featured"
            :key="g.slug"
            :game="g"
            @click="navigateTo(`/games/${g.slug}`)"
            @play="navigateTo(`/games/${g.slug}`)"
          />
        </div>
      </div>

      <!-- Emulators (by platform) -->
      <div class="home-section">
        <div class="section-header">
          <div class="sec-title">🖥️ Emulators <span class="count-badge">{{ platformStats.length }}</span></div>
          <button class="sec-more" @click="navigateTo('/games')">View all →</button>
        </div>
        <div class="scroll-row">
          <div
            v-for="p in platformStats"
            :key="p.name"
            class="game-card-mini"
            @click="navigateTo(`/${slugFor(p.name)}-games`)"
          >
            <div class="mini-cover" style="font-size:28px">{{ emojiFor(p.name) }}</div>
            <div class="mini-title">{{ p.name }}<small>{{ p.count }} games</small></div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { GameListResponse, GameSummary } from '~/types/games'

// Fetch games for homepage sections
const { data, pending } = useFetch<GameListResponse>('/api/games', {
  query: { limit: 200 },
  key: 'homepage',
})

const allGames = computed(() => data.value?.games || [])
const totalAll = computed(() => data.value?.totalAll || 0)
const platforms = computed(() => data.value?.platforms || [])

// Recent games (reversed)
const recent = computed(() => [...allGames.value].reverse().slice(0, 12))

// Featured games (first 12)
const featured = computed(() => allGames.value.slice(0, 12))

// Platform stats (sorted by game count)
const platformStats = computed(() => {
  const counts: Record<string, number> = {}
  allGames.value.forEach((g: GameSummary) => {
    counts[g.platform] = (counts[g.platform] || 0) + 1
  })
  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12)
})

// Emoji for platform
function emojiFor(platform: string): string {
  const map: Record<string, string> = {
    'Arcade': '🕹️',
    'NES': '🎮',
    'SNES': '🎮',
    'Game Boy Advance': '📱',
    'Game Boy': '📱',
    'Nintendo 64': '🎮',
    'PlayStation': '🎮',
    'Sega Genesis': '🎮',
    'Nintendo DS': '📱',
    'Sega Master System': '🎮',
    'PC Engine CD': '💿',
    'Sega Game Gear': '📱',
    'Atari Jaguar': '🖥️',
    'Sega CD': '💿',
    'Bandai WonderSwan': '📱',
    'NeoGeo Pocket': '📱',
    'Virtual Boy': '🥽',
    'Sega Saturn': '🎮',
    'Sega 32X': '🎮',
    'Commodore 64': '🖥️',
    'ColecoVision': '🕹️',
    'MSX2': '🖥️',
    'Nintendo Famicom Disk System': '💾',
  }
  return map[platform] || '🖥️'
}

// Platform slug for URLs
function slugFor(platform: string): string {
  const map: Record<string, string> = {
    'NES': 'nes',
    'SNES': 'snes',
    'Nintendo 64': 'n64',
    'Game Boy Advance': 'gba',
    'Game Boy': 'gb',
    'Nintendo DS': 'nds',
    'PlayStation': 'ps',
    'Sega Genesis': 'genesis',
    'Sega Saturn': 'saturn',
    'Sega 32X': 'sega-32x',
    'Sega CD': 'sega-cd',
    'Sega Game Gear': 'sega-game-gear',
    'Sega Master System': 'sega-master-system',
    'Virtual Boy': 'virtual-boy',
    'Atari Jaguar': 'atari-jaguar',
    'Bandai WonderSwan': 'bandai-wonderswan',
    'NeoGeo Pocket': 'neogeo-pocket',
    'PC Engine CD': 'pc-engine-cd',
    'Commodore 64': 'commodore-64',
    'ColecoVision': 'colecovision',
    'Nintendo Famicom Disk System': 'nintendo-famicom',
    'MSX2': 'msx2',
  }
  return map[platform] || platform.toLowerCase().replace(/\s+/g, '-')
}

useSeoMeta({
  title: 'RetroVault — 2000+ Free Retro Games Online',
  description: 'Play 2000+ classic retro games in your browser. NES, SNES, GBA, Arcade, and more. No download, no signup required.',
  ogTitle: 'RetroVault — 2000+ Free Retro Games Online',
  ogDescription: 'Play 2000+ classic retro games in your browser. NES, SNES, GBA, Arcade, and more.',
  ogType: 'website',
})

useSchemaOrg([
  {
    '@type': 'WebSite',
    name: 'RetroVault',
    url: 'https://retrovault.cc',
    description: '2000+ Free Retro Games Online',
  },
])
</script>
