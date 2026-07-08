<template>
  <div class="news-page">
    <h1 class="section-title">
      📝 {{ t('news.title') }}
      <span class="badge purple">{{ t('news.badge') }}</span>
    </h1>

    <div v-if="pending" class="news-empty">
      {{ t('common.loading') }}
    </div>

    <div v-else-if="error" class="news-empty" style="color:var(--color-accent);">
      {{ t('common.error') }}
    </div>

    <div v-else-if="articles?.length" class="article-grid">
      <article
        v-for="article in articles"
        :key="article._id"
        class="article-card"
        @click="navigateTo(`/news/${article.slug}`)"
      >
        <div class="article-card-meta">
          <span class="article-date">{{ formatDate(article.date) }}</span>
          <span v-if="article.category" class="badge green">{{ article.category }}</span>
        </div>
        <h2 class="article-card-title">{{ article.title }}</h2>
        <p class="article-card-desc">{{ article.description }}</p>
        <div v-if="article.tags?.length" class="article-card-tags">
          <span v-for="tag in article.tags" :key="tag" class="tag-item">{{ tag }}</span>
        </div>
      </article>
    </div>

    <div v-else class="news-empty">
      {{ t('news.empty') }}
    </div>
  </div>
</template>

<script setup lang="ts">
const { t, locale } = useAppI18n()

const { data: articles, pending, error } = await useAsyncData('news', () =>
  queryContent('articles')
    .where({ lang: locale.value, _partial: { $ne: true } })
    .sort({ date: -1, pinned: -1 })
    .find()
)

function formatDate(date: string | Date) {
  const d = new Date(date)
  return d.toLocaleDateString(locale.value === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

usePageSeo({
  title: t('seo.newsTitle'),
  description: t('seo.newsDesc'),
})

useSchemaOrg([
  {
    '@type': 'Blog',
    headline: t('seo.newsTitle'),
    description: t('seo.newsDesc'),
  },
])
</script>

<style scoped>
.news-page {
  max-width: 960px;
  margin: 0 auto;
  padding: 24px 16px 48px;
}

.news-empty {
  padding: 40px;
  text-align: center;
  color: var(--color-text-muted);
}

.article-grid {
  display: grid;
  gap: 16px;
  margin-top: 24px;
}

.article-card {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 20px 24px;
  cursor: pointer;
  transition: border-color 0.2s, transform 0.15s;
}

.article-card:hover {
  border-color: var(--color-accent);
  transform: translateY(-2px);
}

.article-card-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.article-date {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  font-family: var(--font-mono);
}

.article-card-title {
  font-family: var(--font-pixel);
  font-size: clamp(0.95rem, 2.5vw, 1.15rem);
  color: var(--color-text-primary);
  margin: 0 0 8px;
  line-height: 1.5;
}

.article-card-desc {
  color: var(--color-text-secondary);
  font-size: 0.95rem;
  line-height: 1.5;
  margin: 0 0 12px;
}

.article-card-tags {
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
</style>
