<template>
  <footer class="footer">
    <div class="footer-inner">
      <!-- Brand + Tagline + Online -->
      <div class="footer-top">
        <div class="pixel-counter">
          <span class="dot"></span>
          <strong class="footer-brand">RETRO VAULT</strong>
        </div>
        <span>— {{ t('footer.tagline') }}</span>
        <span class="pixel-counter" style="margin-left:2px">
          <span class="dot"></span>
          {{ t('footer.playersOnline', { count: onlineCount }) }}
        </span>
      </div>

      <!-- Stats -->
      <div class="footer-stats">
        {{ t('footer.stats', { games: '2,324', platforms: '23' }) }}
      </div>

      <!-- Grid: 3 columns -->
      <div class="footer-grid">
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

        <!-- Column: About -->
        <div class="footer-col">
          <h4 class="footer-col-title">{{ t('nav.about') }}</h4>
          <p class="footer-about-text">{{ t('about.para1') }}</p>
          <p class="footer-powered">{{ t('footer.poweredBy', { tech: 'EmulatorJS, Nuxt & Cloudflare' }) }}</p>
        </div>
      </div>

      <!-- Bottom: Copyright + Disclaimer -->
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

const onlineCount = Math.floor(Math.random() * 50) + 32

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

function authAction() {
  if (isLoggedIn.value) logout()
  else login()
}
</script>
