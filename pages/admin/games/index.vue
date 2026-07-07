<template>
  <div>
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px">
      <h1 style="font-size:1.2rem;font-weight:700;color:var(--color-text-primary)">游戏管理</h1>
      <div style="display:flex;gap:8px">
        <select v-model="filter.platform" @change="load" class="filter-btn" style="padding:6px 12px;border-radius:var(--radius-sm);background:var(--color-bg-surface);border:1px solid var(--color-border);color:var(--color-text-primary)">
          <option value="">全部平台</option>
          <option v-for="p in filterOptions.platforms" :key="p.key" :value="p.key">{{ p.label }}</option>
        </select>
        <select v-model="filter.status" @change="load" class="filter-btn" style="padding:6px 12px;border-radius:var(--radius-sm);background:var(--color-bg-surface);border:1px solid var(--color-border);color:var(--color-text-primary)">
          <option value="">全部状态</option>
          <option v-for="s in filterOptions.statuses" :key="s.key" :value="s.key">{{ s.label }}</option>
        </select>
        <input v-model="filter.search" @input="debouncedLoad" placeholder="搜索..." style="padding:6px 12px;border-radius:var(--radius-sm);background:var(--color-bg-surface);border:1px solid var(--color-border);color:var(--color-text-primary);width:200px">
        <button @click="createGame" class="btn-pixel-green" style="padding:6px 16px;font-size:0.7rem">+ 新增</button>
      </div>
    </div>

    <div v-if="pending" class="flex flex-col gap-3">
      <div v-for="i in 8" :key="i" class="skeleton" style="height:60px;border-radius:var(--radius-sm)" />
    </div>

    <div v-else-if="error" style="color:var(--color-accent);padding:12px">错误：{{ error.message }}</div>

    <div v-else class="card-static" style="overflow:hidden">
      <table style="width:100%;border-collapse:collapse;font-size:0.8rem">
        <thead>
          <tr style="background:var(--color-bg-elevated);color:var(--color-text-secondary)">
            <th style="padding:12px 16px;text-align:left">标题</th>
            <th style="padding:12px 16px;text-align:left">平台</th>
            <th style="padding:12px 16px;text-align:left">年份</th>
            <th style="padding:12px 16px;text-align:left">类型</th>
            <th style="padding:12px 16px;text-align:left">状态</th>
            <th style="padding:12px 16px;text-align:left">语言</th>
            <th style="padding:12px 16px;text-align:right">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="g in games" :key="g.slug" style="border-top:1px solid var(--color-border);cursor:pointer" @click="goGame(g.slug)">
            <td style="padding:12px 16px">
              <div style="font-size:0.8rem;font-weight:600;color:var(--color-accent)">{{ g.title }}</div>
              <div style="font-size:0.7rem;color:var(--color-text-muted)">{{ g.slug }}</div>
            </td>
            <td style="padding:12px 16px;color:var(--color-text-secondary)">{{ g.platformDisplay || g.platform }}</td>
            <td style="padding:12px 16px;color:var(--color-text-secondary)">{{ g.year }}</td>
            <td style="padding:12px 16px;color:var(--color-text-secondary)">{{ g.genreDisplay || g.genre }}</td>
            <td style="padding:12px 16px">
              <span :class="g.status === 'published' ? 'badge-green' : 'badge-yellow'" style="font-size:0.65rem">{{ g.status === 'published' ? '已发布' : '草稿' }}</span>
            </td>
            <td style="padding:12px 16px">
              <div style="display:flex;gap:4px">
                <span v-for="lang in ['en','zh','ja']" :key="lang"
                  :class="hasLang(g, lang) ? 'badge-green' : 'badge-pink'"
                  style="font-size:0.6rem;padding:2px 6px">
                  {{ lang }}
                </span>
              </div>
            </td>
            <td style="padding:12px 16px;text-align:right" @click.stop>
              <NuxtLink :to="`/admin/games/${g.slug}`" class="btn-pixel" style="padding:4px 12px;font-size:0.65rem">编辑</NuxtLink>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="total > limit" style="display:flex;justify-content:center;gap:8px;margin-top:20px">
      <button @click="page--;load()" :disabled="page <= 1" class="btn-pixel" style="padding:6px 16px;font-size:0.7rem">上一页</button>
      <span style="color:var(--color-text-secondary);padding:6px 0;font-size:0.8rem">{{ page }} / {{ totalPages }}</span>
      <button @click="page++;load()" :disabled="page * limit >= total" class="btn-pixel" style="padding:6px 16px;font-size:0.7rem">下一页</button>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'admin',
  middleware: ['admin-auth'],
  pageTransition: false,
})

const { adminFetch } = useAdmin()
let debounceTimer
const debouncedLoad = () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => { page.value = 1; load() }, 300)
}

const route = useRoute()
const page = ref(1)
const limit = 48
const filter = reactive({
  platform: String(route.query.platform || ''),
  status: String(route.query.status || ''),
  search: String(route.query.search || ''),
})
const games = ref([])
const total = ref(0)
const filterOptions = ref({ platforms: [], statuses: [] })

const totalPages = computed(() => Math.ceil(total.value / limit))

async function loadData() {
  const params = new URLSearchParams({
    page: String(page.value),
    limit: String(limit),
    platform: filter.platform,
    status: filter.status,
    search: filter.search,
  })
  return adminFetch(`/api/admin/games?${params}`)
}

const { pending, error, refresh } = useAsyncData('admin-games', () =>
  loadData().then(r => {
    games.value = r.games
    total.value = r.total
    filterOptions.value = r.filters
    return r
  })
, { watch: [page], server: false, lazy: true })

const router = useRouter()
function goGame(slug) {
  router.push(`/admin/games/${slug}`)
}
function createGame() {
  router.push('/admin/games/__new__')
}

async function load() { await refresh() }

function hasLang(game, lang) {
  if (!game.langs) return lang === 'en'
  try {
    const langs = typeof game.langs === 'string' ? JSON.parse(game.langs) : game.langs
    return langs[lang] && (langs[lang].title || langs[lang].description)
  } catch {
    return false
  }
}
</script>
