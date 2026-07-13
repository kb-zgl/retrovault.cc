<template>
  <div>
    <!-- Emulator overlay moved to app.vue (global, survives navigation) -->

    <!-- TODO loading -->
    <div v-if="pending" class="pt-6">
      <div class="skeleton" style="width:120px;height:34px;margin-bottom:16px;" />
      <div class="detail-header">
        <div class="skeleton" style="width:120px;height:120px;border-radius:var(--radius-sm);flex-shrink:0" />
        <div class="detail-info">
          <div class="skeleton" style="width:70%;height:22px;margin-bottom:8px" />
          <div class="skeleton" style="width:50%;height:16px;margin-bottom:10px" />
          <div class="skeleton" style="width:100%;height:60px;margin-bottom:14px;border-radius:var(--radius-sm)" />
          <div class="flex gap-2">
            <div class="skeleton" style="width:120px;height:40px;border-radius:var(--radius-lg)" />
            <div class="skeleton" style="width:120px;height:40px;border-radius:var(--radius-lg)" />
          </div>
        </div>
      </div>
    </div>

    <!-- TODO 404 -->
    <div v-else-if="error" class="pt-10 text-center">
      <div style="font-size:2.4rem;margin-bottom:12px">🕹️</div>
      <h2 style="font-family:var(--font-pixel);font-size:1rem;color:var(--color-text-primary);margin-bottom:8px">
        {{ t('common.notFound') }}
      </h2>
      <p class="font-body text-[clamp(0.6rem,1.5vw,0.7rem)]" style="color:var(--color-text-muted)">
        {{ t('common.notFoundDesc', { slug }) }}
      </p>
    </div>

    <!-- TODO content -->
    <div v-else-if="game">
      <Breadcrumb :items="breadcrumbItems" />

      <!-- Header: cover + H1 + meta + actions -->
      <div class="detail-header">
        <div class="detail-icon">
          <img
            v-if="coverLoaded"
            :src="game.localCover"
            :alt="loc.title"
            @error="coverLoaded = false"
          />
          <span v-else>🎮</span>
        </div>

        <div class="detail-info">
          <h1 class="detail-title">{{ loc.title }}</h1>

          <div class="detail-meta">
            <NuxtLink
              :to="{ path: localePath('/games'), query: { genre: game.genre } }"
              class="detail-meta-link"
            >🏷️ {{ game.genreName || game.genre }}</NuxtLink>
            <span>📅 {{ game.year }}</span>
            <span v-if="game.developer">🏢 {{ game.developerName || game.developer }}</span>
            <NuxtLink
              v-if="game.platform"
              :to="{ path: localePath('/games'), query: { platform: game.platform } }"
              class="detail-meta-link"
            >🖥️ {{ game.platformName || game.platform }}</NuxtLink>
          </div>

          <div class="detail-actions">
            <button class="btn-pixel btn-pixel-green" @click="engine.loadGame(game!)">
              {{ t('game.playNow') }}
            </button>
            <button
              class="btn-pixel"
              :class="inQueue ? 'btn-pixel-yellow in-queue' : 'btn-pixel-yellow'"
              @click="toggleQueue"
            >
              {{ inQueue ? t('game.inQueue') : t('game.addQueue') }}
            </button>
            <GameShareButton :game="game" />
          </div>
        </div>
      </div>

      <!-- H2: 游戏简介 -->
      <section class="detail-section">
        <h2 class="detail-section-title">{{ t('game.intro') }}</h2>
        <p class="detail-desc">{{ loc.description }}</p>
      </section>

      <!-- Long description (Markdown) -->
      <div v-if="longDescHtml" class="markdown-content" style="margin-top:24px">
        <div v-html="longDescHtml" />
      </div>

      <!-- H2: 游戏控制 -->
      <section v-if="controlsKeys.length" class="detail-section">
        <h2 class="detail-section-title">{{ t('game.controls') }}</h2>
        <div class="controls-grid">
          <div v-for="key in controlsKeys" :key="key" class="controls-row">
            <span class="controls-key">{{ key }}</span>
            <span class="controls-action">{{ controlsMap[key] }}</span>
          </div>
        </div>
      </section>

      <!-- H2: 评分评价 -->
      <section class="detail-section">
        <h2 class="detail-section-title">{{ t('game.rating') }}</h2>
        <p class="detail-placeholder">{{ t('game.noComments') }}</p>
      </section>

      <!-- H2: 相关游戏推荐 + H3 game cards -->
      <section v-if="related.length" class="detail-section">
        <h2 class="detail-section-title">{{ t('game.related') }}</h2>
        <div class="scroll-row">
          <GameCard
            v-for="g in related"
            :key="g.slug"
            :game="g"
            heading-level="h3"
            :to="localePath(`/games/${g.slug}`)"
            @play="navigateTo(localePath(`/games/${g.slug}`))"
          />
        </div>
      </section>

      <!-- TODO Comments -->
      <div class="comment-section">
        <h2 class="cmt-title">
          {{ t('game.comments') }}
          <span class="cmt-count">({{ comments.length }})</span>
        </h2>

        <div class="cmt-form">
          <input
            v-model="cmtName"
            type="text"
            :placeholder="t('comment.placeholderName')"
          />
          <textarea
            v-model="cmtContent"
            :placeholder="t('comment.placeholderContent')"
          ></textarea>
          <button class="cmt-submit" @click="postComment">
            {{ t('game.post') }}
          </button>
        </div>

        <div v-if="comments.length === 0" class="cmt-empty">
          {{ t('game.noComments') }}
        </div>

        <div v-else class="cmt-list">
          <div
            v-for="c in reversedComments"
            :key="c.id"
            class="cmt-item"
          >
            <div class="cmt-header">
              <span class="cmt-user">{{ c.avatar || '👤' }} {{ c.username }}</span>
              <span class="cmt-time">{{ formatTime(c.time) }}</span>
              <button class="cmt-del" @click="deleteComment(c.id)">🗑️</button>
            </div>
            <div class="cmt-content">{{ c.content }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { GameData, GameComment } from '~/types/games'

const { t } = useAppI18n()
const { localePath } = useLocalePath()

const route = useRoute()
const slug = computed(() => String(route.params.slug))
const { localized } = useGameLocale()
const loc = computed(() => localized(game.value))
const { render: renderMd } = useMarkdown()

// Fetch game data
const { data: game, pending, error } = useFetch<GameData>(`/api/games/${slug.value}`, {
  key: `game-${slug.value}`,
})

// SEO: title + description + VideoGame Schema.org
const pageTitle = computed(() => {
  if (!game.value) return t('common.loading')
  return t('seo.detailTitle', { title: loc.value.title })
})

const pageDesc = computed(() => {
  if (!game.value) return t('seo.tagline')
  return t('seo.detailDesc', { description: (loc.value.description || game.value.description).slice(0, 158) })
})

// Rendered Markdown content for SEO-rich game description
const longDescSource = computed(() => {
  if (!game.value) return ''
  // Support both string (new MD format) and string[] (legacy format)
  const raw = loc.value.longDesc || game.value.longDescription
  return Array.isArray(raw) ? raw.join('\n\n') : (raw || '')
})
const longDescHtml = computed(() => renderMd(longDescSource.value))

// Controls
const controlsMap = computed(() => game.value?.controls || {})
const controlsKeys = computed(() => Object.keys(controlsMap.value))

// Related games (placeholder - slugs from game.relatedGames)
const related = computed(() => [])

usePageSeo(() => ({
  title: pageTitle.value,
  description: pageDesc.value,
  ogType: 'video.game',
}))

// Satori OG image (text-focused with cover thumbnail) + canonical URL
const coverUrl = computed(() => game.value?.localCover || null)

defineOgImage('GameOgImage', () => ({
  title: loc.value.title || game.value?.title || 'Retro Game',
  description: (loc.value.description || game.value?.description || '').slice(0, 120),
  cover: coverUrl.value || undefined,
  platform: game.value?.platformName || game.value?.platform || undefined,
  genre: game.value?.genreName || game.value?.genre || undefined,
}))

useHead({
  link: computed(() => [
    { rel: 'canonical', href: `https://retrovault.cc/games/${slug.value}` },
  ]),
})

const breadcrumbItems = useBreadcrumb(computed(() => [
  { label: t('nav.home'), to: localePath('/') },
  { label: t('nav.games'), to: localePath('/games') },
  { label: loc.value.title || game.value?.title || '…' },
]))

useSchemaOrg([
  {
    '@type': 'VideoGame',
    name: computed(() => loc.value.title || game.value?.title || ''),
    description: computed(() => loc.value.description || game.value?.description || ''),
    genre: computed(() => game.value?.genreName ? [game.value.genreName] : game.value?.genre ? [game.value.genre] : []),
    platform: computed(() => game.value?.platformName ? [game.value.platformName] : game.value?.platform ? [game.value.platform] : []),
    datePublished: computed(() => game.value?.year ? String(game.value.year) : undefined),
    author: computed(() => game.value?.developerName ? { '@type': 'Organization', name: game.value.developerName } : undefined),
    publisher: computed(() => game.value?.publisherName ? { '@type': 'Organization', name: game.value.publisherName } : undefined),
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
    applicationCategory: 'Game',
    operatingSystem: 'Browser',
  },
])

// Cover fallback
const coverLoaded = ref(true)

// Engine + Queue
const engine = useGameEngine()
const queueStore = useGameQueue()
const inQueue = computed(() => queueStore.has(slug.value))

function toggleQueue() {
  queueStore.toggle(slug.value)
}

// Comments (localStorage)
const STORAGE_KEY = computed(() => `gameComments_${slug.value}`)
const cmtName = ref('')
const cmtContent = ref('')

const comments = ref<GameComment[]>([])

onMounted(() => {
  const raw = localStorage.getItem(STORAGE_KEY.value)
  if (raw) {
    try { comments.value = JSON.parse(raw) } catch { comments.value = [] }
  }
})

const reversedComments = computed(() => [...comments.value].reverse())

function postComment() {
  const name = cmtName.value.trim() || t('comment.anonymous')
  const content = cmtContent.value.trim()
  if (!content) return

  const avatar = getAvatar()
  comments.value.push({ id: Date.now(), username: name, content, time: Date.now(), avatar })
  localStorage.setItem(STORAGE_KEY.value, JSON.stringify(comments.value))
  cmtContent.value = ''
  cmtName.value = ''
}

function deleteComment(id: number) {
  comments.value = comments.value.filter(c => c.id !== id)
  localStorage.setItem(STORAGE_KEY.value, JSON.stringify(comments.value))
}

function formatTime(ts: number) {
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getAvatar() {
  const avatars = ['👾','🐱','🐶','🦊','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🐔','🐧','🐦','🐤','🐣','🐥','🐺','🐗','🐴','🦄','🐝','🐞','🦋','🐙','🦑','🐬','🐳','🐊','🦕','🦖','🐉','🌵','🎮','🕹️','💎','🌈','⭐','🌙','☀️','⚡','🔥','💧','🍄','🌻','🌸','🌺']
  return avatars[Math.floor(Math.random() * avatars.length)]
}

</script>
