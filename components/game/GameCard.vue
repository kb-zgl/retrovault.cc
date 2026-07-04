<template>
  <div
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

    <!-- Title + year -->
    <div :class="size === 'grid' ? 'game-title' : 'mini-title'">
      {{ game.title }}
      <small>{{ game.year }}</small>
    </div>

    <!-- Tags: platform + genre -->
    <div class="mini-tags">
      <span class="mini-tag">{{ game.platform }}</span>
      <span class="mini-tag">{{ game.genre }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { GameSummary } from '~/types/games'

const props = withDefaults(defineProps<{
  game: GameSummary
  size?: 'mini' | 'grid'
}>(), {
  size: 'mini',
})

defineEmits<{
  click: []
  play: []
}>()

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
