<template>
  <!-- Header: Marquee + Nav (right) + Hamburger (mobile) -->
  <div class="cabinet-header">
    <!-- Marquee -->
    <div class="cabinet-marquee">
      <div class="marquee-lamp">
        <span class="lamp"></span><span class="lamp"></span><span class="lamp"></span><span class="lamp"></span><span class="lamp"></span>
      </div>
      <div class="marquee-title">🕹️ <span>RETRO</span> VAULT</div>
    </div>

    <!-- Desktop nav -->
    <nav class="pixel-nav desktop-nav">
      <NuxtLink class="nav-btn" :class="{ active: route.path === '/' }" :to="localePath('/')">{{ t('nav.home') }}</NuxtLink>
      <NuxtLink class="nav-btn" :class="{ active: route.path.startsWith('/games') }" :to="localePath('/games')">{{ t('nav.games') }}</NuxtLink>
      <NuxtLink class="nav-btn" :class="{ active: route.path === '/tags' }" :to="localePath('/tags')">{{ t('nav.tags') }}</NuxtLink>
      <NuxtLink class="nav-btn" :class="{ active: route.path === '/news' }" :to="localePath('/news')">{{ t('nav.news') }}</NuxtLink>
      <NuxtLink class="nav-btn" :class="{ active: route.path === '/about' }" :to="localePath('/about')">{{ t('nav.about') }}</NuxtLink>
    </nav>

    <div class="hidden sm:flex"><ThemeToggle /></div>

    <!-- Mobile hamburger -->
    <button class="hamburger-btn" @click="mobileMenuOpen = true" aria-label="Menu">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3 12h18M3 6h18M3 18h18" />
      </svg>
    </button>
  </div>

  <!-- Mobile Nav Overlay -->
  <Teleport to="body">
    <div class="nav-overlay" :class="{ open: mobileMenuOpen }" @click.self="mobileMenuOpen = false">
      <button class="nav-close-btn" @click="mobileMenuOpen = false" aria-label="Close menu">✕</button>
      <div class="nav-overlay-items">
        <NuxtLink class="nav-overlay-btn" :class="{ active: route.path === '/' }" :to="localePath('/')" @click="mobileMenuOpen = false">{{ '🏠 ' + t('nav.home') }}</NuxtLink>
        <NuxtLink class="nav-overlay-btn" :class="{ active: route.path.startsWith('/games') }" :to="localePath('/games')" @click="mobileMenuOpen = false">{{ '🎮 ' + t('nav.games') }}</NuxtLink>
        <NuxtLink class="nav-overlay-btn" :class="{ active: route.path === '/tags' }" :to="localePath('/tags')" @click="mobileMenuOpen = false">{{ '🏷️ ' + t('nav.tags') }}</NuxtLink>
        <NuxtLink class="nav-overlay-btn" :class="{ active: route.path === '/news' }" :to="localePath('/news')" @click="mobileMenuOpen = false">{{ '📰 ' + t('nav.news') }}</NuxtLink>
        <NuxtLink class="nav-overlay-btn" :class="{ active: route.path === '/about' }" :to="localePath('/about')" @click="mobileMenuOpen = false">{{ 'ℹ️ ' + t('nav.about') }}</NuxtLink>
      </div>
      <div class="nav-overlay-footer">
        <button class="link-btn" @click="authAction; mobileMenuOpen = false">
          {{ isLoggedIn ? '👤 ' + user?.username : t('footer.login') }}
        </button>
        <button class="link-btn" @click="toggleTheme">
          {{ theme === 'dark' ? t('theme.light') : t('theme.dark') }}
        </button>
        <button class="link-btn" @click="alert('📖 Guestbook coming soon!'); mobileMenuOpen = false">{{ t('footer.guestbook') }}</button>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
const { t } = useAppI18n()
const { localePath } = useLocalePath()

const route = useRoute()
const mobileMenuOpen = ref(false)

const { isLoggedIn, user, login, logout } = useAuth()
const { theme, toggle: toggleTheme } = useTheme()

function authAction() {
  if (isLoggedIn.value) logout()
  else login()
}
</script>
