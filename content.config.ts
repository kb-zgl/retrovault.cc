import { defineContentConfig, defineCollection, z } from '@nuxt/content'

export default defineContentConfig({
  collections: {
    // Blog articles
    articles: defineCollection({
      type: 'page',
      source: 'articles/**/*.md',
      schema: z.object({
        title: z.string(),
        description: z.string(),
        date: z.date(),
        image: z.string().optional(),
        tags: z.array(z.string()).default([]),
        category: z.string().default('general'),
        pinned: z.boolean().default(false),
        lang: z.string().default('en'),
      }),
    }),

    // Static pages (privacy, about, terms, etc.)
    pages: defineCollection({
      type: 'page',
      source: '*.md',
      schema: z.object({
        title: z.string(),
        description: z.string().optional(),
        date: z.date().optional(),
        lang: z.string().default('en'),
      }),
    }),
  },
})
