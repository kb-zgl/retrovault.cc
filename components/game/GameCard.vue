<template>
  <component
    :is="clickable ? 'div' : 'div'"
    :class="[size === 'grid' ? 'game-card' : 'game-card-mini']"
    @click="$emit('click')"
    :data-slug="game.slug"
  >
    <!-- Play button -->
    <button
      :class="size === 'grid' ? 'card-play-btn' : 'mini-play-btn'"
      @click.stop="$emit('play')"
      :aria-label="`Play ${game.title}`"
    >▶</button>

    <!-- Cover -->
    <div :class="size === 'grid' ? 'pixel-icon' : 'mini-cover'">
      <img
        v-if="coverOk"
        :src="`/covers/${game.slug}.webp`"
        :alt="game.title"
        loading="lazy"
        @error="coverOk = false"
      />
      <span v-else>{{ emojiFallback }}</span>
    </div>

    <!-- Title -->
    <div :class="size === 'grid' ? 'game-title' : 'mini-title'">
      {{ game.title }}
      <small>{{ resolvedSubtitle }}</small>
    </div>

    <!-- Tag: mini cards get .mini-tag (optional), grid cards get .game-tag-sm -->
    <span
      v-if="size === 'mini' && tag"
      class="mini-tag"
      :class="tag === 'Featured' ? 'gold' : 'green'"
    >{{ tag }}</span>
    <span
      v-else-if="size === 'grid'"
      class="game-tag-sm"
    >{{ tag || game.platform }}</span>
  </component>
</template>

<script setup lang="ts">
import type { GameSummary } from '~/types/games'

const props = withDefaults(defineProps<{
  game: GameSummary
  size?: 'mini' | 'grid'
  tag?: string
  subtitle?: string
}>(), {
  size: 'mini',
})

defineEmits<{
  click: []
  play: []
}>()

const coverOk = ref(true)

// Reset cover on game change
watch(() => props.game.slug, () => { coverOk.value = true })

const resolvedSubtitle = computed(() =>
  props.subtitle
  ?? (props.size === 'grid' ? props.game.genre : undefined)
  ?? props.game.year
  ?? props.game.platform,
)

// Deterministic emoji from game slug
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
