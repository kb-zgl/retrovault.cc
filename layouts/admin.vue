<template>
  <div class="admin-layout" style="background:var(--color-bg-base);min-height:100vh">
    <!-- Admin Nav -->
    <header class="admin-nav" style="background:var(--color-bg-elevated);border-bottom:1px solid var(--color-border);padding:12px 24px;display:flex;align-items:center;gap:24px">
      <NuxtLink to="/admin" class="font-pixel" style="color:var(--color-accent);font-size:0.75rem;text-decoration:none">RetroVault Admin</NuxtLink>
      <nav style="display:flex;gap:16px;flex:1">
        <NuxtLink to="/admin" class="font-body" :style="navStyle('/admin', true)">Dashboard</NuxtLink>
        <NuxtLink to="/admin/games" class="font-body" :style="navStyle('/admin/games')">Games</NuxtLink>
      </nav>
      <button @click="logout" class="font-body" style="color:var(--color-text-muted);font-size:0.75rem;background:none;border:none;cursor:pointer">Sign Out</button>
    </header>

    <!-- Main Content -->
    <main style="max-width:1200px;margin:0 auto;padding:32px 24px">
      <slot />
    </main>
  </div>
</template>

<script setup>
const router = useRouter()
const route = useRoute()

function navStyle(path, exact = false) {
  const active = exact ? route.path === path : route.path.startsWith(path)
  return {
    color: active ? 'var(--color-accent)' : 'var(--color-text-secondary)',
    fontSize: '0.8rem',
    textDecoration: 'none',
    fontWeight: active ? 600 : 400,
  }
}

function logout() {
  localStorage.removeItem('app-token')
  router.push('/')
}
</script>
