<template>
  <div>
    <div class="section-title">
      🔒 Privacy Policy
      <span class="badge purple">Your Data</span>
    </div>

    <div class="markdown-content" v-if="doc">
      <ContentRenderer :value="doc" />
    </div>
    <div v-else class="markdown-content" style="padding:40px;text-align:center;color:var(--color-text-muted);">
      Loading...
    </div>
  </div>
</template>

<script setup lang="ts">
const { data: doc } = await useAsyncData('privacy', () =>
  queryContent('/privacy').findOne()
)

useSeoMeta({
  title: 'Privacy Policy — RetroVault',
  description: 'RetroVault privacy policy. Learn how we collect, use, and protect your data while you enjoy classic retro games online.',
  ogTitle: 'Privacy Policy — RetroVault',
  ogDescription: 'How RetroVault handles your data and privacy.',
  ogType: 'website',
})
</script>
