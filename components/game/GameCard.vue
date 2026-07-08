<template>
  <div
    :class="[size === 'grid' ? 'game-card' : 'game-card-mini']"
    :data-slug="game.slug"
  >
    <!-- Card link (cover + title) -->
    <NuxtLink
      v-if="to"
      :to="to"
      class="game-card-link"
    >
      <!-- Play button -->
      <button
        :class="size === 'grid' ? 'card-play-btn' : 'mini-play-btn'"
        @click.stop="$emit('play')"
        :aria-label="`Play ${loc.title}`"
      >▶</button>

      <!-- Cover -->
      <div :class="size === 'grid' ? 'pixel-icon' : 'mini-cover'">
        <img
          v-if="coverOk"
          :src="`/covers/${game.slug}.webp`"
          :alt="loc.title"
          loading="lazy"
          @error="coverOk = false"
        />
        <span v-else>{{ emojiFallback }}</span>
      </div>

      <!-- Title + year (dynamic heading level) -->
      <component :is="headingTag" :class="size === 'grid' ? 'game-title' : 'mini-title'">
        {{ loc.title }}
        <small>{{ game.year }}</small>
      </component>
    </NuxtLink>
    <div
      v-else
      class="game-card-link"
    >
      <!-- Play button -->
      <button
        :class="size === 'grid' ? 'card-play-btn' : 'mini-play-btn'"
        @click.stop="$emit('play')"
        :aria-label="`Play ${loc.title}`"
      >▶</button>

      <!-- Cover -->
      <div :class="size === 'grid' ? 'pixel-icon' : 'mini-cover'">
        <img
          v-if="coverOk"
          :src="`/covers/${game.slug}.webp`"
          :alt="loc.title"
          loading="lazy"
          @error="coverOk = false"
        />
        <span v-else>{{ emojiFallback }}</span>
      </div>

      <!-- Title + year (dynamic heading level) -->
      <component :is="headingTag" :class="size === 'grid' ? 'game-title' : 'mini-title'">
        {{ loc.title }}
        <small>{{ game.year }}</small>
      </component>
    </div>

    <!-- Tags: platform + genre (inside card wrapper but outside link, prevents nav) -->
    <div class="mini-tags">
      <span class="mini-tag mini-tag-link" @click.stop="goToGames('platform', game.platform)">{{ game.platform }}</span>
      <span class="mini-tag mini-tag-link" @click.stop="goToGames('genre', game.genre)">{{ game.genre }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { GameSummary } from '~/types/games'

const props = withDefaults(defineProps<{
  game: GameSummary
  to?: string
  size?: 'mini' | 'grid'
  headingLevel?: 'h2' | 'h3' | 'h4'
}>(), {
  size: 'mini',
  headingLevel: 'h3',
})

defineEmits<{
  play: []
}>()

const headingTag = computed(() => props.headingLevel)

const router = useRouter()
const { localePath } = useLocalePath()
const { localized } = useGameLocale()
const loc = computed(() => localized(props.game))

function goToGames(filter: 'platform' | 'genre', value: string) {
  router.push(localePath(`/games?${filter}=${encodeURIComponent(value)}`))
}

const coverOk = ref(true)

watch(() => props.game.slug, () => { coverOk.value = true })

const emojiPool = ['👾', '🐉', '🏎️', '🧙', '🤖', '🍄', '🧟', '🚀', '👊', '🏁', '🧛', '🐱', '⚔️', '🐺', '🔫', '👑', '🎯', '🏯', '🦊', '💎', '🌌', '🎸', '🏰', '🐲']
const emojiFallback = computed(() => {
  let hash = 0
  for (let i = 0; i < props.game.slug.length; i++) {
    hash = ((hash << 5) - hash) + props.game.slug.charCodeAt(i)
    hash |= 0
  }
  return emojiPool[Math.abs(hash) % emojiPool.length]
})
</script>
