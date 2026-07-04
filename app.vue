<template>
  <div>
    <!-- Arcade Cabinet -->
    <div class="arcade-cabinet">
      <AppHeader />

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
          <button class="link-btn" @click="authAction">
            {{ isLoggedIn ? '👤 ' + user?.username : '🔑 Login' }}
          </button>
          <NuxtLink class="link-btn" to="/about">📖 About</NuxtLink>
          <NuxtLink class="link-btn" to="/privacy">🔒 Privacy</NuxtLink>
        </div>
      </div>
    </div>

    <!-- Global emulator overlay (app-level, survives page navigation) -->
    <GameEmulator
      v-if="engine.currentGame.value"
      :game="engine.currentGame.value"
      :visible="engine.showEmulator.value"
      @close="closeEmulator"
    />

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

const { isLoggedIn, user, login, logout, handleUrlToken } = useAuth()

// 恢复 localStorage 中的认证令牌
handleUrlToken()

function authAction() {
  if (isLoggedIn.value) logout()
  else login()
}

// Global game engine state
const engine = useGameEngine()
const history = useGameHistory()

function closeEmulator() {
  if (engine.currentGame.value) {
    history.record(engine.currentGame.value.slug)
    history.saveSession(engine.currentGame.value.slug, { highScore: engine.score.value })
  }
  engine.closeGame()
}

// Footer: online count
const onlineCount = Math.floor(Math.random() * 50) + 32
</script>
