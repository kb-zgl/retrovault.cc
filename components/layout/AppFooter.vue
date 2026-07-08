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
            >{{ t(`footer.platform.${p.slug}`) }}</NuxtLink>
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
            <button class="link-btn" @click="authAction">
              {{ isLoggedIn ? '👤 ' + user?.username : t('footer.login') }}
            </button>
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
const { t } = useAppI18n()
const { localePath } = useLocalePath()
const year = new Date().getFullYear()
const { isLoggedIn, user, login, logout } = useAuth()

const onlineCount = Math.floor(Math.random() * 50) + 32

const platforms = [
  { slug: 'nes', name: 'NES' },
  { slug: 'snes', name: 'SNES' },
  { slug: 'gba', name: 'Game Boy Advance' },
  { slug: 'arcade', name: 'Arcade' },
  { slug: 'n64', name: 'Nintendo 64' },
  { slug: 'genesis', name: 'Sega Genesis' },
  { slug: 'ps', name: 'PlayStation' },
  { slug: 'gb', name: 'Game Boy' },
]

function authAction() {
  if (isLoggedIn.value) logout()
  else login()
}
</script>
