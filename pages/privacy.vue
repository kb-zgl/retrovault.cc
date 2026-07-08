<template>
  <div>
    <h1 class="section-title">
      🔒 {{ t('privacy.title') }}
      <span class="badge purple">{{ t('privacy.badge') }}</span>
    </h1>

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

const { t } = useAppI18n()

usePageSeo({
  title: t('seo.privacyTitle'),
  description: t('seo.privacyDesc'),
})
</script>
