<template>
  <div>
    <!-- SEO: H1 站点描述 -->
    <h1 class="sr-only">{{ t('seo.tagline') }}</h1>

    <!-- Hero -->
    <div class="hero-enter" @click="navigateTo(localePath('/games'))">
      <img src="/logo.svg" alt="RetroVault" class="hero-logo" />
      <p class="hero-sub">{{ t('hero.sub') }}</p>
      <div class="hero-actions">
        <button class="btn-pixel btn-pixel-green" @click.stop="playRandom">
          🎲 {{ t('fab.random') }}
        </button>
        <NuxtLink :to="localePath('/games')" class="btn-pixel" @click.stop>
          {{ t('section.viewAll') }}
        </NuxtLink>
      </div>
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
      <!-- H2: Continue Playing -->
      <div v-if="continueGames.length" class="home-section">
        <div class="section-header">
          <h2 class="sec-title">🔄 {{ t('home.continuePlaying') }}</h2>
        </div>
        <div class="scroll-row">
          <GameCard
            v-for="g in continueGames"
            :key="g.slug"
            :game="g"
            :to="localePath(`/games/${g.slug}`)"
            @play="navigateTo(localePath(`/games/${g.slug}`))"
          />
        </div>
      </div>

      <!-- H2: Queue -->
      <div v-if="queueGames.length" class="home-section">
        <div class="section-header">
          <h2 class="sec-title">⏭ {{ t('home.yourQueue') }}</h2>
        </div>
        <div class="scroll-row">
          <GameCard
            v-for="g in queueGames"
            :key="g.slug"
            :game="g"
            :to="localePath(`/games/${g.slug}`)"
            @play="navigateTo(localePath(`/games/${g.slug}`))"
          />
        </div>
      </div>

      <!-- H2: New & Updated -->
      <div class="home-section">
        <div class="section-header">
          <h2 class="sec-title">🆕 {{ t('section.recent') }}</h2>
          <NuxtLink :to="localePath('/games')" class="sec-more">{{ t('section.viewAll') }}</NuxtLink>
        </div>
        <div class="scroll-row">
          <GameCard
            v-for="g in recent"
            :key="g.slug"
            :game="g"
            :to="localePath(`/games/${g.slug}`)"
            @play="navigateTo(localePath(`/games/${g.slug}`))"
          />
        </div>
      </div>

      <!-- H2: Featured -->
      <div class="home-section">
        <div class="section-header">
          <h2 class="sec-title">⭐ {{ t('section.featured') }}</h2>
          <NuxtLink :to="localePath('/games')" class="sec-more">{{ t('section.viewAll') }}</NuxtLink>
        </div>
        <div class="featured-grid">
          <GameCard
            v-for="g in featured"
            :key="g.slug"
            :game="g"
            size="grid"
            :to="localePath(`/games/${g.slug}`)"
            @play="navigateTo(localePath(`/games/${g.slug}`))"
          />
        </div>
      </div>

      <!-- H2: Platforms -->
      <div class="home-section">
        <div class="section-header">
          <h2 class="sec-title">🎮 {{ t('home.platforms') }}</h2>
          <NuxtLink :to="localePath('/games')" class="sec-more">{{ t('section.viewAll') }}</NuxtLink>
        </div>
        <div class="category-grid">
          <NuxtLink
            v-for="p in topPlatforms"
            :key="p.name"
            :to="localePath(`/${slugFor(p.name)}-games`)"
            class="category-card"
          >
            <span class="emoji-big">{{ emojiFor(p.name) }}</span>
            <span class="cat-name">{{ p.name }}</span>
            <span class="cat-count">{{ t('hero.count', { count: p.count }) }}</span>
          </NuxtLink>
        </div>
      </div>

      <!-- H2: Genres -->
      <div class="home-section">
        <div class="section-header">
          <h2 class="sec-title">📂 {{ t('home.genres') }}</h2>
          <NuxtLink :to="localePath('/games')" class="sec-more">{{ t('section.viewAll') }}</NuxtLink>
        </div>
        <div class="category-grid">
          <NuxtLink
            v-for="g in topGenres"
            :key="g.name"
            :to="localePath(`/games?genre=${encodeURIComponent(g.name)}`)"
            class="category-card"
          >
            <span class="emoji-big">{{ genreEmoji(g.name) }}</span>
            <span class="cat-name">{{ g.name }}</span>
            <span class="cat-count">{{ t('hero.count', { count: g.count }) }}</span>
          </NuxtLink>
        </div>
      </div>

      <!-- FAQ -->
      <section class="faq-section">
        <h2 class="section-title">{{ t('home.faqTitle') }}</h2>
        <div class="faq-list">
          <div v-for="(item, i) in faqEntries" :key="i" class="faq-item">
            <h3 class="faq-q">{{ t(item.q) }}</h3>
            <p class="faq-a">{{ t(item.a) }}</p>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { GameListResponse, GameSummary } from '~/types/games'

const { t } = useAppI18n()
const { localePath } = useLocalePath()
const router = useRouter()

// Fetch games for homepage sections
const { data, pending } = useFetch<GameListResponse>('/api/games', {
  query: { limit: 200 },
  key: 'homepage',
})

const allGames = computed(() => data.value?.games || [])
const totalAll = computed(() => data.value?.totalAll || 0)

// ── H2: Continue Playing ──────────────────────────

const { getRecent: getHistoryRecent, load: loadHistory } = useGameHistory()
const { queue: queueRef, load: loadQueue } = useGameQueue()

onMounted(() => {
  loadHistory()
  loadQueue()
})

const continueGames = computed(() => {
  const slugs = getHistoryRecent(6)
  if (!slugs.length) return []
  return slugs
    .map(slug => allGames.value.find(g => g.slug === slug))
    .filter(Boolean) as GameSummary[]
})

// ── H2: Queue ─────────────────────────────────────

const queueGames = computed(() => {
  const slugs = queueRef.value
  if (!slugs.length) return []
  return slugs
    .map(slug => allGames.value.find(g => g.slug === slug))
    .filter(Boolean) as GameSummary[]
})

// ── H2: Recent（最新添加）────────────────────────

const recent = computed(() => [...allGames.value].reverse().slice(0, 12))

// ── H2: Featured（精选前12）──────────────────────

const featured = computed(() => allGames.value.slice(0, 12))

// ── H2: Platforms（前8 + View All）────────────────

const platformStats = computed(() => {
  const counts: Record<string, number> = {}
  allGames.value.forEach((g: GameSummary) => {
    counts[g.platform] = (counts[g.platform] || 0) + 1
  })
  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
})

const topPlatforms = computed(() => platformStats.value)

// ── H2: Genres（前8 + View All）──────────────────

const genreStats = computed(() => {
  const counts: Record<string, number> = {}
  allGames.value.forEach((g: GameSummary) => {
    if (g.genre) counts[g.genre] = (counts[g.genre] || 0) + 1
  })
  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
})

const topGenres = computed(() => genreStats.value)

// ── Random play ──────────────────────────────────

function playRandom() {
  const games = allGames.value
  if (!games.length) return
  const pick = games[Math.floor(Math.random() * games.length)]
  if (pick) navigateTo(localePath(`/games/${pick.slug}`))
}

// ── Emoji helpers ────────────────────────────────

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

function genreEmoji(genre: string): string {
  const map: Record<string, string> = {
    'Platformer': '🦘',
    'RPG': '⚔️',
    'Fighting': '👊',
    'Action': '💥',
    'Action-Platformer': '🎯',
    'Racing': '🏎️',
    'Beat \'em up': '👊',
    'Sports': '⚽',
    'Action-Adventure': '🗡️',
    'Shoot \'em up': '🔫',
    'Puzzle': '🧩',
    'Run and Gun': '🏃',
    'Shooter': '🔫',
    'Adventure': '🧭',
    'Survival Horror': '🧟',
    'Strategy': '♟️',
    'Simulation': '🎮',
  }
  return map[genre] || '🎮'
}

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
    'Arcade': 'arcade',
  }
  return map[platform] || platform.toLowerCase().replace(/\s+/g, '-')
}

const faqEntries = [
  { q: 'home.faqFree', a: 'home.faqFreeA' },
  { q: 'home.faqAccount', a: 'home.faqAccountA' },
  { q: 'home.faqMobile', a: 'home.faqMobileA' },
  { q: 'home.faqSave', a: 'home.faqSaveA' },
  { q: 'home.faqPlatforms', a: 'home.faqPlatformsA' },
  { q: 'home.faqStuck', a: 'home.faqStuckA' },
]

usePageSeo({
  title: t('seo.homeTitle'),
  description: t('seo.homeDesc'),
})

const schemaFaq = computed(() => faqEntries.map(item => ({
  '@type': 'Question' as const,
  name: t(item.q),
  acceptedAnswer: {
    '@type': 'Answer' as const,
    text: t(item.a),
  },
})))

useSchemaOrg([
  {
    '@type': 'WebSite',
    name: 'RetroVault',
    url: 'https://retrovault.cc',
    description: t('seo.tagline'),
  },
  {
    '@type': 'FAQPage',
    mainEntity: schemaFaq,
  },
])
</script>
