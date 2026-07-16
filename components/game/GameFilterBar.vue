<template>
  <div class="gfb-root">
    <!-- H1 + subtitle -->
    <div class="gfb-hero">
      <h1 class="gfb-title">{{ t('nav.games') }}</h1>
      <p class="gfb-sub">{{ t('games.subtitle', { count: totalAll }) }}</p>
    </div>

    <!-- Search -->
    <div class="gfb-search-wrap">
      <span class="gfb-search-icon">🔍</span>
      <input
        ref="searchInput"
        v-model="localSearch"
        class="gfb-search"
        type="search"
        :placeholder="t('games.searchPlaceholder')"
        @input="onSearchInput"
      />
      <button v-if="localSearch" class="gfb-search-clear" @click="clearSearch" aria-label="Clear search">✕</button>
    </div>

    <!-- Dropdown row -->
    <div class="gfb-dropdown-row">
      <FilterDropdown
        :label="t('filter.genre')"
        :options="genres"
        :model-value="selectedGenre"
        @update:model-value="emit('update:selectedGenre', $event)"
        :placeholder="t('filter.all')"
      />
      <FilterDropdown
        :label="t('filter.platform')"
        :options="platforms"
        :model-value="selectedPlatform"
        @update:model-value="emit('update:selectedPlatform', $event)"
        :placeholder="t('filter.all')"
      />
      <FilterDropdown
        :label="t('filter.year')"
        :options="decadeOptions"
        :model-value="selectedDecade ? String(selectedDecade) : ''"
        @update:model-value="emit('update:selectedDecade', $event ? Number($event) : 0)"
        :placeholder="t('filter.all')"
      />
      <FilterDropdown
        :label="t('filter.more')"
        :options="moreOptions"
        :model-value="selectedTag"
        @update:model-value="emit('update:selectedTag', $event)"
        placeholder="全部"
      />
    </div>

    <!-- Active chips -->
    <div v-if="hasActiveFilters" class="gfb-chips">
      <span v-if="selectedGenre" class="gfb-chip">
        {{ chipGenre }}
        <button @click="emit('update:selectedGenre', '')" aria-label="Remove">✕</button>
      </span>
      <span v-if="selectedPlatform" class="gfb-chip">
        {{ chipPlatform }}
        <button @click="emit('update:selectedPlatform', '')" aria-label="Remove">✕</button>
      </span>
      <span v-if="selectedDecade" class="gfb-chip">
        {{ selectedDecade }}s
        <button @click="emit('update:selectedDecade', 0)" aria-label="Remove">✕</button>
      </span>
      <span v-if="selectedTag" class="gfb-chip">
        {{ selectedTag }}
        <button @click="emit('update:selectedTag', '')" aria-label="Remove">✕</button>
      </span>
      <span v-if="localSearch" class="gfb-chip">
        "{{ localSearch }}"
        <button @click="clearSearch" aria-label="Remove">✕</button>
      </span>
      <button class="gfb-chip-clear" @click="emit('clear')">{{ t('filter.clear') }}</button>
      <span class="gfb-chip-count">{{ t('filter.results', { count: total }) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  selectedGenre: string
  selectedPlatform: string
  selectedDecade: number
  selectedTag: string
  search: string
  genres: (string | { label: string; value: string })[]
  platforms: (string | { label: string; value: string })[]
  total: number
  totalAll: number
  decadeYears: number[]
}>()

const emit = defineEmits<{
  'update:selectedGenre': [value: string]
  'update:selectedPlatform': [value: string]
  'update:selectedDecade': [value: number]
  'update:selectedTag': [value: string]
  'update:search': [value: string]
  'clear': []
}>()

const { t } = useAppI18n()

// Local search with debounce
const searchInput = ref<HTMLInputElement | null>(null)
const localSearch = ref(props.search)
let debounceTimer: ReturnType<typeof setTimeout> | null = null

const decadeOptions = computed(() =>
  props.decadeYears.map(d => ({ label: `${d}s`, value: String(d) }))
)

// "更多" dropdown: tag-based filters
const moreOptions = computed(() => [
  { label: '🏷️ Hack Rom', value: 'hack' },
  { label: '🏷️ 汉化', value: 'hàn huà' },
  { label: '🏷️ New', value: 'new' },
])

watch(() => props.search, (val) => {
  if (!debounceTimer) localSearch.value = val
})

function onSearchInput() {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    emit('update:search', localSearch.value.trim())
    debounceTimer = null
  }, 300)
}

function clearSearch() {
  localSearch.value = ''
  if (debounceTimer) clearTimeout(debounceTimer)
  emit('update:search', '')
  searchInput.value?.focus()
}

function optionLabel(opts: (string | { label: string; value: string })[], val: string): string {
  const found = opts.find(o => (typeof o === 'string' ? o : o.value) === val)
  return found ? (typeof found === 'string' ? found : found.label) : val
}

const chipGenre = computed(() => optionLabel(props.genres, props.selectedGenre))
const chipPlatform = computed(() => optionLabel(props.platforms, props.selectedPlatform))

const hasActiveFilters = computed(() =>
  !!props.selectedGenre || !!props.selectedPlatform || !!props.selectedDecade ||
  !!props.selectedTag || !!localSearch.value
)
</script>
