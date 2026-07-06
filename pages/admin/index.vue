<template>
  <div>
    <h1 style="font-size:1.2rem;font-weight:700;color:var(--color-text-primary);margin-bottom:24px">Dashboard</h1>

    <div v-if="pending" class="flex gap-4">
      <div v-for="i in 4" :key="i" class="skeleton" style="flex:1;height:100px;border-radius:var(--radius-md)" />
    </div>

    <div v-else class="stats-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;margin-bottom:32px">
      <div class="card" style="padding:20px">
        <div style="font-size:0.7rem;color:var(--color-text-secondary);margin-bottom:8px">Total Games</div>
        <div style="font-size:1.8rem;font-weight:700;color:var(--color-text-primary)">{{ stats.total }}</div>
      </div>
      <div class="card" style="padding:20px">
        <div style="font-size:0.7rem;color:var(--color-text-secondary);margin-bottom:8px">Published</div>
        <div style="font-size:1.8rem;font-weight:700;color:var(--color-success)">{{ stats.published }}</div>
      </div>
      <div class="card" style="padding:20px">
        <div style="font-size:0.7rem;color:var(--color-text-secondary);margin-bottom:8px">Drafts</div>
        <div style="font-size:1.8rem;font-weight:700;color:var(--color-warning)">{{ stats.draft }}</div>
      </div>
      <div class="card" style="padding:20px">
        <div style="font-size:0.7rem;color:var(--color-text-secondary);margin-bottom:8px">With 中文</div>
        <div style="font-size:1.8rem;font-weight:700;color:var(--color-accent-secondary)">{{ stats.withZh }}</div>
      </div>
    </div>

    <div v-if="error" style="color:var(--color-accent);font-size:0.85rem;padding:12px">Failed to load stats: {{ error.message }}</div>
  </div>
</template>

<script setup>
definePageMeta({
  middleware: ['admin-auth']
})

const { adminFetch } = useAdmin()
const { data: stats, pending, error } = useAsyncData('admin-stats', () => adminFetch('/api/admin/stats'))
</script>
