<template>
  <footer class="footer">
    <div class="footer-inner">
      <!-- Grid: 3 columns -->
      <div class="footer-grid">
        <!-- Column: Brand + About -->
        <div class="footer-col">
          <div class="footer-brand-row">
            <span class="dot"></span>
            <strong class="footer-brand">RETRO VAULT</strong>
						<span class="footer-tagline">— {{ t('footer.tagline') }}</span>
          </div>
          
					<p class="footer-about-text">{{ t('about.para1') }}</p>
          <!-- <span class="footer-stats-line">{{ t('footer.stats', { games: siteStats?.games?.toLocaleString() || '...', platforms: siteStats?.platforms || '...' }) }}</span> -->
          
          <p class="footer-powered">{{ t('footer.poweredBy', { tech: 'EmulatorJS, Nuxt & Cloudflare' }) }}</p>
        </div>

        <!-- Column: Platforms -->
        <div class="footer-col">
          <h4 class="footer-col-title">{{ t('footer.platforms') }}</h4>
          <div class="footer-platforms">
            <NuxtLink
              v-for="p in platforms"
              :key="p.slug"
              :to="localePath(`/${p.slug}-games`)"
              class="footer-platform-link"
            >{{ platformLabel(p.refKey) }}</NuxtLink>
          </div>
        </div>

        <!-- Column: Quick Links -->
        <div class="footer-col">
          <h4 class="footer-col-title">{{ t('footer.quickLinks') }}</h4>
          <div class="footer-page-links">
            <NuxtLink :to="localePath('/about')">{{ t('nav.about') }}</NuxtLink>
            <NuxtLink :to="localePath('/games')">{{ t('nav.games') }}</NuxtLink>
            <NuxtLink :to="localePath('/tags')">{{ t('nav.tags') }}</NuxtLink>
            <NuxtLink :to="localePath('/privacy')">{{ t('footer.privacy') }}</NuxtLink>
          </div>
        </div>
      </div>

      <div class="footer-bottom">
        <p class="footer-copyright">&copy; {{ year }} RetroVault</p>
        <p class="footer-disclaimer">{{ t('footer.disclaimer') }}</p>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { getReferenceData } from '~/utils/reference-data'

const { t, locale } = useAppI18n()
const { localePath } = useLocalePath()
const year = new Date().getFullYear()

const platforms = [
  { slug: 'nes', refKey: 'nes' },
  { slug: 'snes', refKey: 'snes' },
  { slug: 'gba', refKey: 'game-boy-advance' },
  { slug: 'arcade', refKey: 'arcade' },
  { slug: 'n64', refKey: 'nintendo-64' },
  { slug: 'genesis', refKey: 'sega-genesis' },
  { slug: 'ps', refKey: 'playstation' },
  { slug: 'gb', refKey: 'game-boy' },
]

const refData = computed(() => getReferenceData(locale.value))

function platformLabel(refKey: string): string {
  const entry = refData.value.platforms.find(p => p.key === refKey)
  return entry?.label || refKey
}
</script>
