<template>
  <div class="breadcrumb">
    <template v-for="(item, i) in items" :key="i">
      <!-- Separator (skip first) -->
      <span v-if="i > 0" class="sep">›</span>

      <!-- Last item: plain text -->
      <span v-if="!item.to && i === items.length - 1" class="current">
        {{ item.label }}
      </span>

      <!-- Link item (not last, or optional last with to) -->
      <NuxtLink v-else-if="item.to" :to="item.to">
        {{ item.label }}
      </NuxtLink>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { BreadcrumbItem } from '~/composables/useBreadcrumb'

defineProps<{
  items: BreadcrumbItem[]
}>()
</script>
