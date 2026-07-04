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
      <NuxtLink class="nav-btn" :class="{ active: route.path === '/' }" to="/">Home</NuxtLink>
      <NuxtLink class="nav-btn" :class="{ active: route.path.startsWith('/games') }" to="/games">Games</NuxtLink>
      <NuxtLink class="nav-btn" :class="{ active: route.path === '/tags' }" to="/tags">Tags</NuxtLink>
      <NuxtLink class="nav-btn" :class="{ active: route.path === '/news' }" to="/news">News</NuxtLink>
      <NuxtLink class="nav-btn" :class="{ active: route.path === '/about' }" to="/about">About</NuxtLink>
    </nav>

    <ThemeToggle class="hidden sm:flex" />

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
        <NuxtLink class="nav-overlay-btn" :class="{ active: route.path === '/' }" to="/" @click="mobileMenuOpen = false">🏠 Home</NuxtLink>
        <NuxtLink class="nav-overlay-btn" :class="{ active: route.path.startsWith('/games') }" to="/games" @click="mobileMenuOpen = false">🎮 Games</NuxtLink>
        <NuxtLink class="nav-overlay-btn" :class="{ active: route.path === '/tags' }" to="/tags" @click="mobileMenuOpen = false">🏷️ Tags</NuxtLink>
        <NuxtLink class="nav-overlay-btn" :class="{ active: route.path === '/news' }" to="/news" @click="mobileMenuOpen = false">📰 News</NuxtLink>
        <NuxtLink class="nav-overlay-btn" :class="{ active: route.path === '/about' }" to="/about" @click="mobileMenuOpen = false">ℹ️ About</NuxtLink>
      </div>
      <div class="nav-overlay-footer">
        <button class="link-btn" @click="authAction; mobileMenuOpen = false">
          {{ isLoggedIn ? '👤 ' + user?.username : '🔑 Login' }}
        </button>
        <button class="link-btn" @click="mobileMenuOpen = false">
          <ThemeToggle />
        </button>
        <button class="link-btn" @click="alert('📖 Guestbook coming soon!'); mobileMenuOpen = false">💬 Guestbook</button>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
const route = useRoute()
const mobileMenuOpen = ref(false)

const { isLoggedIn, user, login, logout } = useAuth()

function authAction() {
  if (isLoggedIn.value) logout()
  else login()
}
</script>
