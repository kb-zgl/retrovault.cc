<template>
  <div class="breadcrumb">
    <template v-for="(item, i) in items" :key="i">
      <!-- Separator (skip first) -->
      <span v-if="i > 0" class="sep">›</span>

      <!-- Link item (if has to) -->
      <NuxtLink v-if="item.to" :to="item.to" :class="{ current: i === items.length - 1 }">
        {{ item.label }}
      </NuxtLink>

      <!-- Plain text item -->
      <span v-else class="current">{{ item.label }}</span>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { BreadcrumbItem } from '~/composables/useBreadcrumb'

defineProps<{
  items: BreadcrumbItem[]
}>()
</script>
