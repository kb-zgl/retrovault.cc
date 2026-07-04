<template>
  <div>
    <Breadcrumb :items="breadcrumbItems" />

    <!-- Title -->
    <div class="section-title">
      🖥️ {{ displayName }} Games
      <span class="badge-purple badge">{{ total }} games</span>
    </div>

    <!-- Loading -->
    <div v-if="pending" class="game-list-full">
      <div v-for="n in 12" :key="n" class="game-card" style="padding:0;border:none;background:transparent">
        <div class="skeleton" style="width:100%;aspect-ratio:1/1;border-radius:var(--radius-sm);margin-bottom:10px" />
        <div class="skeleton" style="width:80%;height:12px;margin:0 auto" />
      </div>
    </div>

    <!-- Empty -->
    <div v-else-if="games.length === 0" class="empty-state">
      <div class="icon" style="font-size:32px">🕹️</div>
      <h3>No games found</h3>
      <p>Platform "{{ route.params.platform }}" has no games in our vault</p>
    </div>

    <!-- Grid -->
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
        <span class="game-tag-sm">{{ g.year }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { GameListResponse } from '~/types/games'

const route = useRoute()

useSeoMeta({
  title: computed(() => `${displayName.value} Games Online Free — RetroVault`),
  description: computed(() => `Play ${displayName.value} games online free in your browser. Browse the full collection of ${displayName.value} retro games at RetroVault.`),
  ogTitle: computed(() => `${displayName.value} Games — RetroVault`),
  ogDescription: computed(() => `Play ${displayName.value} games online free.`),
  ogType: 'website',
})

const breadcrumbItems = useBreadcrumb(computed(() => [
  { label: 'Home', to: '/' },
  { label: 'Games', to: '/games' },
  { label: displayName.value },
]))

const platformSlug = computed(() => {
  const raw = route.params.platform as string
  // "nes-games" → "nes", "game-boy-advance-games" → "game-boy-advance"
  return raw.replace(/-games$/, '')
})

// Map slug to full platform name (what the API expects)
const platformName = computed(() => {
  const map: Record<string, string> = {
    'nes': 'NES',
    'snes': 'SNES',
    'n64': 'Nintendo 64',
    'gba': 'Game Boy Advance',
    'gb': 'Game Boy',
    'nds': 'Nintendo DS',
    'ps': 'PlayStation',
    'ps1': 'PlayStation',
    'genesis': 'Sega Genesis',
    'saturn': 'Sega Saturn',
    'arcade': 'Arcade',
    'sega-32x': 'Sega 32X',
    'sega-cd': 'Sega CD',
    'sega-game-gear': 'Sega Game Gear',
    'sega-master-system': 'Sega Master System',
    'virtual-boy': 'Virtual Boy',
    'atari-jaguar': 'Atari Jaguar',
    'bandai-wonderswan': 'Bandai WonderSwan',
    'neogeo-pocket': 'NeoGeo Pocket',
    'pc-engine-cd': 'PC Engine CD',
    'commodore-64': 'Commodore 64',
    'colecovision': 'ColecoVision',
    'nintendo-famicom': 'Nintendo Famicom Disk System',
    'msx2': 'MSX2',
  }
  return map[platformSlug.value] || platformSlug.value.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
})

const displayName = platformName

// Fetch games for this platform
const { data, pending } = useFetch<GameListResponse>('/api/games', {
  query: { platform: platformName.value, limit: 200 },
  key: `platform-${platformSlug.value}`,
})

const games = computed(() => data.value?.games || [])
const total = computed(() => data.value?.total || 0)
</script>
