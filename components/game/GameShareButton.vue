<template>
  <div>
    <button class="btn-pixel share-btn" @click="show = true">
      📤 Share
    </button>

    <GameShareDialog
      :game="game"
      :visible="show"
      @close="show = false"
    />
  </div>
</template>

<script setup lang="ts">
import type { GameData } from '~/types/games'

defineProps<{
  game: GameData
}>()

const show = ref(false)
</script>

<style scoped>
.share-btn {
  background: transparent;
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}
.share-btn:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}
</style>
