<template>
  <div>
    <!-- Arcade Cabinet -->
    <div class="arcade-cabinet">
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

        <!-- Mobile hamburger -->
        <button class="hamburger-btn" @click="mobileMenuOpen = true" aria-label="Menu">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 12h18M3 6h18M3 18h18" />
          </svg>
        </button>
      </div>

      <!-- Main Content -->
      <main>
        <NuxtPage />
      </main>

      <!-- Footer -->
      <div class="footer">
        <div class="footer-top">
          <div class="pixel-counter">
            <span class="dot"></span>
            <span>Players online {{ onlineCount }}</span>
          </div>
        </div>
        <div class="footer-links">
          <button class="link-btn" @click="openLogin">
            {{ loggedInUser ? '👤 Account' : '🔑 Login' }}
          </button>
          <span v-if="loggedInUser" class="login-status">👋 {{ loggedInUser }}</span>
          <NuxtLink class="link-btn" to="/about">📖 About</NuxtLink>
          <NuxtLink class="link-btn" to="/privacy">🔒 Privacy</NuxtLink>
        </div>
      </div>
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
          <button class="link-btn" @click="openLogin; mobileMenuOpen = false">
            {{ loggedInUser ? '👤 Account' : '🔑 Login' }}
          </button>
          <button class="link-btn" @click="alert('📖 Guestbook coming soon!'); mobileMenuOpen = false">💬 Guestbook</button>
        </div>
      </div>
    </Teleport>

    <!-- Login Modal -->
    <div class="login-overlay" :class="{ active: loginOpen }" @click.self="loginOpen = false">
      <div class="login-modal">
        <div class="modal-title">🔑 Login</div>
        <div class="input-group">
          <label>👤 Username</label>
          <input v-model="loginUsername" type="text" placeholder="Your nickname" @keyup.enter="doLogin" />
        </div>
        <div class="input-group">
          <label>🔒 Password</label>
          <input v-model="loginPassword" type="password" placeholder="Anything works" @keyup.enter="doLogin" />
        </div>
        <div class="error-msg">{{ loginError }}</div>
        <div class="login-actions">
          <button class="login-btn" @click="doLogin">🚀 Login</button>
          <button class="cancel-btn" @click="loginOpen = false">✕ Cancel</button>
        </div>
      </div>
    </div>

    <!-- FAB (teleported to body inside component) -->
    <GameFAB />
  </div>
</template>

<script setup lang="ts">
useHead({
  titleTemplate: '%s',
  link: [
    { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
    { rel: 'icon', type: 'image/png', sizes: '96x96', href: '/favicon-96x96.png' },
    { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
    { rel: 'manifest', href: '/site.webmanifest' },
  ],
  meta: [
    { name: 'theme-color', content: '#0a0a0b' },
  ],
  script: [
    {
      innerHTML: `(function(){var p=localStorage.getItem('app-theme');var t='dark';if(p==='light'||p==='dark')t=p;else{var h=new Date().getHours();t=(h>=6&&h<18)?'light':'dark'}document.documentElement.setAttribute('data-theme',t)})()`,
      type: 'text/javascript',
      tagPosition: 'head',
    },
  ],
})

useKeyboardShortcuts()

const route = useRoute()
const mobileMenuOpen = ref(false)

// Global game engine state
const engine = useGameEngine()

// Footer: online count
const onlineCount = Math.floor(Math.random() * 50) + 32

// Login state
const loginOpen = ref(false)
const loginUsername = ref('')
const loginPassword = ref('')
const loginError = ref('')
const loggedInUser = ref('')

onMounted(() => {
  const saved = localStorage.getItem('retrovault_user')
  if (saved) loggedInUser.value = saved
})

function openLogin() {
  if (loggedInUser.value) {
    const logout = confirm(`Logged in as: ${loggedInUser.value}\nClick OK to logout.`)
    if (logout) {
      loggedInUser.value = ''
      localStorage.removeItem('retrovault_user')
    }
    return
  }
  loginUsername.value = ''
  loginPassword.value = ''
  loginError.value = ''
  loginOpen.value = true
}

function doLogin() {
  const u = loginUsername.value.trim()
  const p = loginPassword.value.trim()
  if (!u) { loginError.value = 'Enter username'; return }
  if (!p) { loginError.value = 'Enter password'; return }
  loggedInUser.value = u
  localStorage.setItem('retrovault_user', u)
  loginOpen.value = false
  loginError.value = ''
}
</script>
