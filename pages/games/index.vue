<template>
  <div>
    <Breadcrumb :items="breadcrumbItems" />

    <!-- Title -->
    <div class="section-title">
      🎮 Games
      <span class="badge-purple badge">{{ totalAll ? `${totalAll} total` : 'Loading...' }}</span>
    </div>

    <!-- Loading state -->
    <div v-if="pending" class="game-list-full">
      <div v-for="n in 12" :key="n" class="game-card" style="padding:0;border:none;background:transparent">
        <div class="skeleton" style="width:100%;aspect-ratio:1/1;border-radius:var(--radius-sm);margin-bottom:10px" />
        <div class="skeleton" style="width:80%;height:12px;margin:0 auto" />
      </div>
    </div>

    <template v-else>
      <!-- Filter bar (horizontal scroll) -->
      <div class="filter-bar-scroll">
        <span class="filter-label-pill">📂</span>
        <button
          v-for="g in genres"
          :key="g"
          class="filter-btn"
          :class="{ active: selectedGenre === g }"
          @click="toggleGenre(g)"
        >
          {{ g }}
        </button>

        <span class="filter-label-pill" style="margin-left:4px">🖥️</span>
        <button
          v-for="plat in platforms"
          :key="plat"
          class="filter-btn"
          :class="{ active: selectedPlatform === plat }"
          @click="togglePlatform(plat)"
        >
          {{ plat }}
        </button>

        <button
          v-if="selectedPlatform || selectedGenre"
          class="filter-btn clear-btn"
          @click="clearFilters"
          style="margin-left:4px"
        >✕</button>
      </div>

      <!-- Result info -->
      <div class="filter-result-info">{{ resultInfo }}</div>

      <!-- Empty state -->
      <div v-if="games.length === 0" class="empty-state">
        <div class="icon" style="font-size:32px">🎮</div>
        <h3>No games found</h3>
        <p>Try a different filter combination</p>
      </div>

      <!-- Game grid -->
      <div v-else class="game-list-full">
        <div
          v-for="g in games"
          :key="g.slug"
          class="game-card"
          @click="navigateTo(`/games/${g.slug}`)"
        >
          <button class="card-play-btn" @click.stop="navigateTo(`/games/${g.slug}`)">▶</button>
          <div class="pixel-icon">🎮</div>
          <div class="game-title">
            {{ g.title }}
            <small>{{ g.genre }}</small>
          </div>
          <span class="game-tag-sm">{{ g.platform }}</span>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="total > limit" class="flex justify-center gap-2 mt-6">
        <button
          class="page-btn"
          :disabled="page <= 1"
          @click="page--"
        >‹</button>
        <button
          v-for="p in pageRange"
          :key="p"
          class="page-btn"
          :class="{ active: p === page }"
          @click="page = p"
        >{{ p }}</button>
        <button
          class="page-btn"
          :disabled="page >= totalPages"
          @click="page++"
        >›</button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { GameListResponse } from '~/types/games'

const route = useRoute()
const router = useRouter()

useSeoMeta({
  title: 'All Retro Games — Play Online Free | RetroVault',
  description: 'Browse 2000+ retro games. Filter by platform and genre. Play NES, SNES, GBA, Arcade games online in your browser.',
  ogTitle: 'All Retro Games — RetroVault',
  ogDescription: 'Browse and play 2000+ retro games online free.',
  ogType: 'website',
})

const breadcrumbItems = useBreadcrumb([
  { label: 'Home', to: '/' },
  { label: 'Games' },
])

// Filter state from URL query (shareable filters)
const selectedPlatform = ref(route.query.platform as string || '')
const selectedGenre = ref(route.query.genre as string || '')
const page = ref(parseInt(route.query.page as string) || 1)
const limit = 48

// Fetch games
const { data, pending, refresh } = useFetch<GameListResponse>('/api/games', {
  query: computed(() => ({
    platform: selectedPlatform.value || undefined,
    genre: selectedGenre.value || undefined,
    page: page.value,
    limit,
  })),
  key: 'game-list',
})

const games = computed(() => data.value?.games || [])
const total = computed(() => data.value?.total || 0)
const totalAll = computed(() => data.value?.totalAll || 0)
const platforms = computed(() => data.value?.platforms || [])
const genres = computed(() => data.value?.genres || [])

const totalPages = computed(() => Math.ceil(total.value / limit))

// Pagination range (show max 7 pages)
const pageRange = computed(() => {
  const tp = totalPages.value
  const cp = page.value
  if (tp <= 7) return Array.from({ length: tp }, (_, i) => i + 1)
  if (cp <= 4) return [1, 2, 3, 4, 5, '...', tp]
  if (cp >= tp - 3) return [1, '...', tp - 4, tp - 3, tp - 2, tp - 1, tp]
  return [1, '...', cp - 1, cp, cp + 1, '...', tp]
})

// Result info text
const resultInfo = computed(() => {
  const totalVal = total.value
  const allVal = totalAll.value
  const plat = selectedPlatform.value
  const genre = selectedGenre.value
  if (!plat && !genre) return `Showing all games · ${allVal}`
  let parts: string[] = []
  if (plat) parts.push(`Platform "${plat}"`)
  if (genre) parts.push(`Genre "${genre}"`)
  return `${parts.join(' + ')} · ${totalVal} games`
})

function togglePlatform(cat: string) {
  selectedPlatform.value = selectedPlatform.value === cat ? '' : cat
  page.value = 1
  updateUrl()
}
function toggleGenre(g: string) {
  selectedGenre.value = selectedGenre.value === g ? '' : g
  page.value = 1
  updateUrl()
}
function clearFilters() {
  selectedPlatform.value = ''
  selectedGenre.value = ''
  page.value = 1
  updateUrl()
}

// Sync URL with filter state
function updateUrl() {
  const q: Record<string, string> = {}
  if (selectedPlatform.value) q.platform = selectedPlatform.value
  if (selectedGenre.value) q.genre = selectedGenre.value
  if (page.value > 1) q.page = String(page.value)
  router.replace({ query: q })
}

watch(page, () => updateUrl())
</script>
