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
      <AppFooter />
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

    <!-- Auth modal -->
    <AuthModal
      :visible="showAuthModal"
      @close="showAuthModal = false"
    />
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

const { t } = useAppI18n()

useSchemaOrg([
  defineWebSite({
    name: 'RetroVault',
    url: 'https://retrovault.cc',
    description: t('seo.tagline'),
  }),
  defineOrganization({
    name: 'RetroVault',
    url: 'https://retrovault.cc',
    description: t('seo.tagline'),
  }),
])

const { handleUrlToken, showAuthModal } = useAuth()

// 恢复 localStorage 中的认证令牌
handleUrlToken()

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

</script>
