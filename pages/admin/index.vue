<template>
  <div>
    <h1 style="font-size:1.2rem;font-weight:700;color:var(--color-text-primary);margin-bottom:24px">Dashboard</h1>

    <div v-if="pending && !stats" class="flex gap-4">
      <div v-for="i in 4" :key="i" class="skeleton" style="flex:1;height:100px;border-radius:var(--radius-md)" />
    </div>

    <div v-else-if="stats" class="stats-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;margin-bottom:32px">
      <NuxtLink to="/admin/games" class="card" style="padding:20px;text-decoration:none;display:block;cursor:pointer">
        <div style="font-size:0.7rem;color:var(--color-text-secondary);margin-bottom:8px">Total Games</div>
        <div style="font-size:1.8rem;font-weight:700;color:var(--color-text-primary)">{{ stats.total }}</div>
      </NuxtLink>
      <NuxtLink to="/admin/games?status=published" class="card" style="padding:20px;text-decoration:none;display:block;cursor:pointer">
        <div style="font-size:0.7rem;color:var(--color-text-secondary);margin-bottom:8px">Published</div>
        <div style="font-size:1.8rem;font-weight:700;color:var(--color-success)">{{ stats.published }}</div>
      </NuxtLink>
      <NuxtLink to="/admin/games?status=draft" class="card" style="padding:20px;text-decoration:none;display:block;cursor:pointer">
        <div style="font-size:0.7rem;color:var(--color-text-secondary);margin-bottom:8px">Drafts</div>
        <div style="font-size:1.8rem;font-weight:700;color:var(--color-warning)">{{ stats.draft }}</div>
      </NuxtLink>
      <NuxtLink to="/admin/games?status=published" class="card" style="padding:20px;text-decoration:none;display:block;cursor:pointer">
        <div style="font-size:0.7rem;color:var(--color-text-secondary);margin-bottom:8px">With 中文</div>
        <div style="font-size:1.8rem;font-weight:700;color:var(--color-accent-secondary)">{{ stats.withZh }}</div>
      </NuxtLink>
    </div>

    <div v-if="error" style="color:var(--color-accent);font-size:0.85rem;padding:12px">Failed to load stats: {{ error?.message || error }}</div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'admin',
  middleware: ['admin-auth']
})

const { adminFetch } = useAdmin()
const { data: stats, pending, error } = useAsyncData('admin-stats', () => adminFetch('/api/admin/stats'), {
  server: false,
  lazy: true,
})
</script>
