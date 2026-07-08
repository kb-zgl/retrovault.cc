<template>
  <div class="news-detail">
    <div v-if="pending" class="news-empty">
      {{ t('common.loading') }}
    </div>

    <div v-else-if="error || !article" class="news-empty" style="color:var(--color-accent);">
      <h2>{{ t('common.notFound') }}</h2>
      <p>{{ t('news.notFoundDesc', { slug: route.params.slug as string }) }}</p>
      <NuxtLink :to="isZh ? '/zh/news' : '/news'" class="btn-pixel" style="display:inline-block;margin-top:16px;">
        {{ t('news.back') }}
      </NuxtLink>
    </div>

    <template v-else>
      <NuxtLink :to="isZh ? '/zh/news' : '/news'" class="back-link">
        {{ t('news.back') }}
      </NuxtLink>

      <article class="article-content">
        <header class="article-header">
          <div class="article-meta">
            <time :datetime="article.date">{{ formatDate(article.date) }}</time>
            <span v-if="article.category" class="badge green">{{ article.category }}</span>
          </div>
          <h1>{{ article.title }}</h1>
          <p v-if="article.description" class="article-desc">{{ article.description }}</p>
          <div v-if="article.tags?.length" class="article-tags">
            <span v-for="tag in article.tags" :key="tag" class="tag-item">{{ tag }}</span>
          </div>
        </header>

        <div class="markdown-content">
          <ContentRenderer :value="article" />
        </div>
      </article>
    </template>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const { t, locale } = useAppI18n()

const slug = route.params.slug as string
const isZh = computed(() => route.path.startsWith('/zh/'))
const articleLang = computed(() => (isZh.value ? 'zh' : 'en'))

const { data: article, pending, error } = await useAsyncData(`news-${slug}`, () =>
  queryContent('articles')
    .where({ slug, lang: articleLang.value })
    .findOne()
)

function formatDate(date: string | Date) {
  const d = new Date(date)
  return d.toLocaleDateString(locale.value === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const pageTitle = computed(() =>
  article.value?.title
    ? `${article.value.title} — RetroVault`
    : t('seo.newsTitle')
)

usePageSeo({
  title: pageTitle,
  description: article.value?.description || t('seo.newsDesc'),
  ogType: 'article',
})
</script>

<style scoped>
.news-detail {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px 16px 48px;
}

.news-empty {
  padding: 40px;
  text-align: center;
  color: var(--color-text-muted);
}

.back-link {
  display: inline-block;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
  margin-bottom: 24px;
  transition: color 0.2s;
}

.back-link:hover {
  color: var(--color-accent);
}

.article-header {
  margin-bottom: 32px;
}

.article-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  font-family: var(--font-mono);
  font-size: 0.85rem;
  color: var(--color-text-secondary);
}

.article-header h1 {
  font-family: var(--font-pixel);
  font-size: clamp(1.3rem, 4vw, 1.8rem);
  color: var(--color-text-primary);
  margin: 0 0 12px;
  line-height: 1.4;
}

.article-desc {
  font-size: 1.1rem;
  color: var(--color-text-secondary);
  line-height: 1.6;
  margin: 0 0 16px;
}

.article-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag-item {
  background: var(--color-bg-elevated);
  color: var(--color-text-secondary);
  font-size: 0.75rem;
  padding: 2px 10px;
  border-radius: 99px;
}

.article-content :deep(h2) {
  font-family: var(--font-pixel);
  font-size: 1.15rem;
  margin-top: 40px;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--color-border);
}

.article-content :deep(h3) {
  font-family: var(--font-pixel);
  font-size: 1rem;
  margin-top: 28px;
  margin-bottom: 12px;
}

.article-content :deep(blockquote) {
  border-left: 3px solid var(--color-accent);
  padding: 8px 16px;
  margin: 16px 0;
  background: var(--color-bg-elevated);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
}
</style>
