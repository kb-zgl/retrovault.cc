<template>
  <div class="min-h-screen">
    <AppHeader />
    <AppSidebar />
    <main class="pt-13 lg:pl-55">
      <div class="mx-auto max-w-350 px-6 py-6">
        <NuxtPage />
      </div>
    </main>
    <AppFooter />
    <MobileTabBar />
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
</script>
