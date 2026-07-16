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

          <p class="footer-powered">{{ t('footer.poweredBy', { tech: 'EmulatorJS, Nuxt & Cloudflare' }) }}</p>
        </div>

        <!-- Column: Platforms -->
        <div class="footer-col">
          <strong class="footer-col-title">{{ t('footer.platforms') }}</strong>
          <div class="footer-platforms">
            <NuxtLink
              v-for="p in platforms"
              :key="p.key"
              :to="localePath(`/games?platform=${p.key}`)"
              class="footer-platform-link"
            >{{ p.label }}</NuxtLink>
          </div>
        </div>

        <!-- Column: Quick Links -->
        <div class="footer-col">
          <strong class="footer-col-title">{{ t('footer.quickLinks') }}</strong>
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

// Curated platform subset — refKeys match platforms.json keys
const PLATFORM_KEYS = [
  'nes',
  'snes',
  'game-boy-advance',
  'arcade',
  'nintendo-64',
  'sega-genesis',
  'playstation',
  'game-boy',
]

const platforms = computed(() => {
  const all = getReferenceData(locale.value).platforms
  return all.filter(p => PLATFORM_KEYS.includes(p.key))
})
</script>
