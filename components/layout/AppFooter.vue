<template>
  <footer class="footer">
    <div class="max-w-[1400px] mx-auto px-6">
      <!-- Brand + Tagline + Online -->
      <div class="footer-top">
        <div class="pixel-counter">
          <span class="dot"></span>
          <strong style="font-family:var(--font-pixel);font-size:clamp(0.7rem,1.8vw,0.85rem);color:var(--color-text-primary);letter-spacing:1px">
            RETRO VAULT
          </strong>
        </div>
        <span style="color:var(--color-text-muted)">— {{ t('footer.tagline') }}</span>
        <span class="pixel-counter" style="margin-left:2px">
          <span class="dot"></span>
          {{ t('footer.playersOnline', { count: onlineCount }) }}
        </span>
      </div>

      <!-- Stats -->
      <div class="footer-stats">
        {{ t('footer.stats', { games: '2,324', platforms: '23' }) }}
      </div>

      <!-- Platform Quick Links -->
      <div class="footer-platforms">
        <div class="footer-platforms-label">{{ t('footer.platforms') }}</div>
        <NuxtLink
          v-for="p in platforms"
          :key="p.slug"
          :to="localePath(`/${p.slug}-games`)"
          class="footer-platform-link"
        >{{ p.name }}</NuxtLink>
      </div>

      <!-- Page Links + Login -->
      <div class="footer-links">
        <button class="link-btn" @click="authAction">
          {{ isLoggedIn ? '👤 ' + user?.username : t('footer.login') }}
        </button>
        <NuxtLink :to="localePath('/about')">{{ t('nav.about') }}</NuxtLink>
        <NuxtLink :to="localePath('/games')">{{ t('nav.games') }}</NuxtLink>
        <NuxtLink :to="localePath('/tags')">{{ t('nav.tags') }}</NuxtLink>
        <NuxtLink :to="localePath('/privacy')">{{ t('privacy.badge') }}</NuxtLink>
      </div>

      <!-- Legal + Tech -->
      <div class="footer-bottom">
        <p class="footer-copyright">&copy; {{ year }} RetroVault</p>
        <p class="footer-disclaimer">{{ t('footer.disclaimer') }}</p>
        <p class="footer-powered">{{ t('footer.poweredBy', { tech: 'EmulatorJS, Nuxt & Cloudflare' }) }}</p>
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
