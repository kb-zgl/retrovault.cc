<template>
  <div>
    <div class="section-title">
      {{ t('news.title') }}
      <span class="badge blue">{{ t('news.badge') }}</span>
    </div>

    <div class="article-list">
      <div
        v-for="article in articles"
        :key="article.title"
        class="article-item"
      >
        <div class="article-title">{{ article.title }}</div>
        <div class="article-meta">
          <span class="author">{{ article.author }}</span>
          <span>{{ article.date }}</span>
          <span
            v-for="tag in article.tags"
            :key="tag"
            class="art-tag"
          >{{ tag }}</span>
        </div>
        <div class="article-excerpt">{{ article.excerpt }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Article {
  title: string
  author: string
  date: string
  tags: string[]
  excerpt: string
}

const articles: Article[] = [
  {
    title: '🎮 Pixel Game Dev Guide — From Zero to Arcade',
    author: '👤 PixelDriver',
    date: '📅 2026-06-18',
    tags: ['Guide', 'Dev'],
    excerpt: 'A deep dive into pixel game creation: engine choice, pixel art, physics, and building your own retro arcade game from scratch. Covers tools like Pyxel, Tiled, and basic game loops.',
  },
  {
    title: '🏆 June Tournament Recap: Highlights',
    author: '👤 Reporter',
    date: '📅 2026-06-16',
    tags: ['Tournament', 'Community'],
    excerpt: '128 players competed this month. "MECH WAR" champion PixelKing scored 99,999 points in an intense final round. Full bracket and match analysis inside.',
  },
  {
    title: '🕹️ Arcade History: From the 80s to Modern Revival',
    author: '👤 RetroFan',
    date: '📅 2026-06-14',
    tags: ['Culture', 'History'],
    excerpt: 'From Space Invaders to Street Fighter — why pixel aesthetics still captivate us today. A journey through the golden age of arcades and the indie revival.',
  },
  {
    title: '⚡ Online Multiplayer Lag Optimization',
    author: '👤 Techie',
    date: '📅 2026-06-12',
    tags: ['Tech', 'Multiplayer'],
    excerpt: 'How we reduced P2P latency with rollback netcode and frame sync. Technical deep-dive into GGPO-inspired techniques for browser-based retro multiplayer.',
  },
]

const { t } = useAppI18n()

useSeoMeta({
  title: t('seo.newsTitle'),
  description: t('seo.newsDesc'),
  ogTitle: t('seo.newsTitle'),
  ogDescription: t('seo.newsDesc'),
  ogType: 'article',
})
</script>
