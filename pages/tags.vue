<template>
  <div>
    <div class="section-title">
      {{ t('tagCloud.title') }}
      <span class="badge green">{{ total }} tags</span>
    </div>

    <div v-if="pending" class="tag-cloud">
      <span
        v-for="n in 20"
        :key="n"
        class="skeleton"
        :style="{
          width: `${60 + Math.random() * 80}px`,
          height: `${28 + Math.random() * 16}px`,
          borderRadius: 'var(--radius-lg)',
        }"
      />
    </div>

    <div v-else class="tag-cloud">
      <NuxtLink
        v-for="t in tags"
        :key="t.name"
        :to="tagLinkPath(t.name)"
        class="tag-item"
        :class="t.count > 40 ? 'large' : t.count > 15 ? 'medium' : ''"
      >
        {{ t.name }}
        <span class="count">{{ t.count }}</span>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
interface TagEntry {
  name: string
  count: number
}

interface TagsResponse {
  total: number
  tags: TagEntry[]
}

const { t } = useAppI18n()
const { localePath } = useLocalePath()

const { data, pending } = useFetch<TagsResponse>('/api/tags', { key: 'tags' })

const tags = computed(() => data.value?.tags || [])
const total = computed(() => data.value?.total || 0)

function tagLinkPath(tag: string): string {
  return localePath('/games') + '?tag=' + encodeURIComponent(tag)
}

useSeoMeta({
  title: t('seo.tagsTitle'),
  description: t('seo.tagsDesc'),
  ogTitle: t('seo.tagsTitle'),
  ogDescription: t('seo.tagsDesc'),
  ogType: 'website',
})
</script>
