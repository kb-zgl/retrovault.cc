<template>
  <div
    class="game-card-mini-wrapper"
    :class="[size === 'full' ? 'game-card' : 'game-card-mini']"
    :data-slug="game.slug"
    @click="$emit('click', game.slug)"
  >
    <!-- Play button -->
    <button
      class="card-play-btn-small"
      :class="size === 'full' ? 'card-play-btn' : 'mini-play-btn'"
      @click.stop="$emit('play', game.slug)"
    >
      ▶
    </button>

    <!-- Cover -->
    <div class="card-cover">
      <img
        v-if="coverOk"
        :src="`/covers/${game.slug}.webp`"
        :alt="game.title"
        @error="coverOk = false"
      />
      <span v-else class="card-cover-fallback">{{ emojiFor(game.title) }}</span>
    </div>

    <!-- Title -->
    <div class="card-title">
      {{ game.title }}
      <small>{{ game.year || game.platform }}</small>
    </div>

    <!-- Optional tag -->
    <span v-if="tag" class="mini-tag" :class="tag === 'Featured' ? 'gold' : 'green'">
      {{ tag }}
    </span>
  </div>
</template>

<script setup lang="ts">
import type { GameSummary } from '~/types/games'

defineProps<{
  game: GameSummary
  tag?: string
  size?: 'mini' | 'full'
}>()

defineEmits<{
  play: [slug: string]
  click: [slug: string]
}>()

const coverOk = ref(true)

// Deterministic emoji from game title (first char code → emoji index)
function emojiFor(title: string): string {
  const pool = ['👾','🐉','🏎️','🧙','🤖','🍄','🧟','🚀','👊','🏁','🧛','🐱','⚔️','🐺','🔫','👑','🎯','🏯','🦊','💎','🌌','🎸','🏰','🐲']
  let hash = 0
  for (let i = 0; i < title.length; i++) {
    hash = ((hash << 5) - hash) + title.charCodeAt(i)
    hash |= 0
  }
  return pool[Math.abs(hash) % pool.length]
}
</script>

<style scoped>
.card-play-btn-small {
  font-family: var(--font-pixel);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.1s ease;
  z-index: 2;
  cursor: pointer;
}
.card-play-btn-small:active {
  transform: scale(0.9);
}

/* Cover image */
.card-cover {
  width: 100%;
  aspect-ratio: 1/1;
  background: #1e1b26;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.card-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.card-cover-fallback {
  font-size: clamp(2.2rem, 9vw, 3rem);
}
</style>
