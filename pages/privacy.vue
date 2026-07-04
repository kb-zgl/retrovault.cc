<template>
  <div>
    <div class="section-title">
      🔒 Privacy Policy
      <span class="badge purple">Your Data</span>
    </div>

    <div class="markdown-content">
      <ContentDoc path="/privacy" />
    </div>
  </div>
</template>

<script setup lang="ts">
useSeoMeta({
  title: 'Privacy Policy — RetroVault',
  description: 'RetroVault privacy policy. Learn how we collect, use, and protect your data while you enjoy classic retro games online.',
  ogTitle: 'Privacy Policy — RetroVault',
  ogDescription: 'How RetroVault handles your data and privacy.',
  ogType: 'website',
})
</script>
