<template>
  <div>
    <!-- Loading state -->
    <div v-if="pending" class="game-list-full">
      <div v-for="n in 12" :key="n" class="game-card" style="padding:0;border:none;background:transparent">
        <div class="skeleton" style="width:100%;aspect-ratio:1/1;border-radius:var(--radius-sm);margin-bottom:10px" />
        <div class="skeleton" style="width:80%;height:12px;margin:0 auto" />
      </div>
    </div>

    <template v-else>
      <!-- Filter bar: H1 + search + dropdowns + chips -->
      <GameFilterBar
        :selected-genre="selectedGenre"
        :selected-platform="selectedPlatform"
        :selected-decade="selectedDecade"
        :selected-tag="selectedTag"
        :search="searchQuery"
        :genres="genres"
        :platforms="platforms"
        :total="total"
        :total-all="totalAll"
        :decade-years="decades"
        @update:selected-genre="updateFilter('genre', $event)"
        @update:selected-platform="updateFilter('platform', $event)"
        @update:selected-decade="updateDecade"
        @update:selected-tag="updateFilter('tag', $event)"
        @update:search="updateSearch"
        @clear="clearFilters"
      />

      <!-- Empty state -->
      <div v-if="games.length === 0" class="empty-state">
        <div class="icon" style="font-size:32px">🎮</div>
        <h3>{{ t('filter.emptyTitle') }}</h3>
        <p>{{ t('filter.emptyHint') }}</p>
      </div>

      <!-- Game grid -->
      <div v-else class="game-list-full">
        <GameCard
          v-for="g in games"
          :key="g.slug"
          :game="g"
          size="mini"
          heading-level="h2"
          :to="localePath(`/games/${g.slug}`)"
          @play="navigateTo(localePath(`/games/${g.slug}`))"
        />
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
const { t } = useAppI18n()
const { localePath } = useLocalePath()

usePageSeo({
  title: t('seo.gamesTitle'),
  description: t('seo.gamesDesc'),
})

useSchemaOrg([
  {
    '@type': 'CollectionPage',
    name: t('seo.gamesTitle'),
    description: t('seo.gamesDesc'),
  },
])

const decades = [1980, 1990, 2000, 2010, 2020]

// Filter state from URL query
const selectedPlatform = ref(route.query.platform as string || '')
const selectedGenre = ref(route.query.genre as string || '')
const selectedDecade = ref(route.query.year ? parseInt(route.query.year as string) : 0)
const selectedTag = ref(route.query.tag as string || '')
const searchQuery = ref(route.query.q as string || '')
const page = ref(parseInt(route.query.page as string) || 1)
const limit = 48

// Fetch games
const { data, pending } = useFetch<GameListResponse>('/api/games', {
  query: computed(() => ({
    platform: selectedPlatform.value || undefined,
    genre: selectedGenre.value || undefined,
    year: selectedDecade.value ? `${selectedDecade.value}s` : undefined,
    tag: selectedTag.value || undefined,
    q: searchQuery.value || undefined,
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

function updateFilter(key: string, value: string) {
  if (key === 'genre') selectedGenre.value = value
  else if (key === 'platform') selectedPlatform.value = value
  else if (key === 'tag') selectedTag.value = value
  page.value = 1
  updateUrl()
}

function updateDecade(dec: number) {
  selectedDecade.value = dec
  page.value = 1
  updateUrl()
}

function updateSearch(q: string) {
  searchQuery.value = q
  page.value = 1
  updateUrl()
}

function clearFilters() {
  selectedPlatform.value = ''
  selectedGenre.value = ''
  selectedDecade.value = 0
  selectedTag.value = ''
  searchQuery.value = ''
  page.value = 1
  updateUrl()
}

function updateUrl() {
  const q: Record<string, string> = {}
  if (selectedPlatform.value) q.platform = selectedPlatform.value
  if (selectedGenre.value) q.genre = selectedGenre.value
  if (selectedDecade.value) q.year = String(selectedDecade.value)
  if (selectedTag.value) q.tag = selectedTag.value
  if (searchQuery.value) q.q = searchQuery.value
  if (page.value > 1) q.page = String(page.value)
  router.replace({ query: q })
}

watch(page, () => updateUrl())

// Sync from URL changes (browser nav)
watch(() => route.query, (q) => {
  selectedPlatform.value = (q.platform as string) || ''
  selectedGenre.value = (q.genre as string) || ''
  selectedDecade.value = q.year ? parseInt(q.year as string) : 0
  selectedTag.value = (q.tag as string) || ''
  searchQuery.value = (q.q as string) || ''
  page.value = parseInt((q.page as string) || '') || 1
})
</script>
