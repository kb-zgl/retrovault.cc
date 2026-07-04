<template>
  <div>
    <!-- Hero -->
    <section class="pt-12 pb-10">
      <div class="hero-tag">Starter Template</div>
      <h1 class="hero-title">Nuxt Cloudflare <em>Starter</em></h1>
      <p class="hero-sub">
        Production-ready boilerplate with Nuxt 4, Tailwind CSS v4, dark/light theme,
        UI components, SEO, OG images, and Cloudflare deployment.
      </p>
      <div class="flex gap-2 flex-wrap">
        <a href="https://nuxt.com" target="_blank" rel="noopener noreferrer" class="btn-primary">Nuxt Docs</a>
        <a href="https://tailwindcss.com" target="_blank" rel="noopener noreferrer" class="btn-secondary">Tailwind Docs</a>
        <a href="https://developers.cloudflare.com" target="_blank" rel="noopener noreferrer" class="btn-secondary">Cloudflare Docs</a>
      </div>
    </section>

    <!-- Feature grid -->
    <section class="pt-4 pb-8">
      <h2 class="font-sans font-bold text-[15px] mb-5" style="color: var(--color-text-primary)">What's Included</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div class="card">
          <div class="text-lg mb-1">🎨</div>
          <div class="font-sans font-semibold text-[13px] mb-1" style="color: var(--color-text-primary)">Design System</div>
          <div class="font-body text-[11px]" style="color: var(--color-text-secondary)">CSS variables, dark/light mode, Inter + JetBrains Mono fonts, Indigo accent</div>
        </div>
        <div class="card">
          <div class="text-lg mb-1">🧩</div>
          <div class="font-sans font-semibold text-[13px] mb-1" style="color: var(--color-text-primary)">UI Components</div>
          <div class="font-body text-[11px]" style="color: var(--color-text-secondary)">Button, Input, Select, Badge, Tag, Toast, Skeleton — all theme-aware</div>
        </div>
        <div class="card">
          <div class="text-lg mb-1">📐</div>
          <div class="font-sans font-semibold text-[13px] mb-1" style="color: var(--color-text-primary)">Layout System</div>
          <div class="font-body text-[11px]" style="color: var(--color-text-secondary)">Responsive header, sidebar, footer, mobile tab bar, dark/light toggle</div>
        </div>
        <div class="card">
          <div class="text-lg mb-1">🔍</div>
          <div class="font-sans font-semibold text-[13px] mb-1" style="color: var(--color-text-primary)">SEO Ready</div>
          <div class="font-body text-[11px]" style="color: var(--color-text-secondary)">usePageSeo composable, OG image generation, sitemap, robots.txt</div>
        </div>
        <div class="card">
          <div class="text-lg mb-1">☁️</div>
          <div class="font-sans font-semibold text-[13px] mb-1" style="color: var(--color-text-primary)">Cloudflare Native</div>
          <div class="font-body text-[11px]" style="color: var(--color-text-secondary)">Pages deployment, Workers via Nitro, D1/KV/R2 bindings template</div>
        </div>
        <div class="card">
          <div class="text-lg mb-1">📝</div>
          <div class="font-sans font-semibold text-[13px] mb-1" style="color: var(--color-text-primary)">Nuxt Content v3</div>
          <div class="font-body text-[11px]" style="color: var(--color-text-secondary)">Markdown-based content management, queryCollection API, ISR ready</div>
        </div>
      </div>
    </section>

    <!-- Getting started -->
    <section class="py-8">
      <h2 class="font-sans font-bold text-[15px] mb-5" style="color: var(--color-text-primary)">Getting Started</h2>
      <div class="card !cursor-default space-y-3 font-body text-[12px]" style="color: var(--color-text-secondary); font-family: var(--font-mono)">
        <div><span style="color: var(--color-accent)">1.</span> Edit <code style="background:var(--color-bg-elevated);border:1px solid var(--color-border);border-radius:3px;padding:1px 6px;font-size:11px">pages/index.vue</code> to customize this page</div>
        <div><span style="color: var(--color-accent)">2.</span> Update <code style="background:var(--color-bg-elevated);border:1px solid var(--color-border);border-radius:3px;padding:1px 6px;font-size:11px">assets/css/main.css</code> to change theme colors</div>
        <div><span style="color: var(--color-accent)">3.</span> Add your routes in <code style="background:var(--color-bg-elevated);border:1px solid var(--color-border);border-radius:3px;padding:1px 6px;font-size:11px">pages/</code> and components in <code style="background:var(--color-bg-elevated);border:1px solid var(--color-border);border-radius:3px;padding:1px 6px;font-size:11px">components/</code></div>
        <div><span style="color: var(--color-accent)">4.</span> Configure site info in <code style="background:var(--color-bg-elevated);border:1px solid var(--color-border);border-radius:3px;padding:1px 6px;font-size:11px">nuxt.config.ts</code> and <code style="background:var(--color-bg-elevated);border:1px solid var(--color-border);border-radius:3px;padding:1px 6px;font-size:11px">composables/usePageSeo.ts</code></div>
        <div><span style="color: var(--color-accent)">5.</span> Deploy: <code style="background:var(--color-bg-elevated);border:1px solid var(--color-border);border-radius:3px;padding:1px 6px;font-size:11px">pnpm build && wrangler deploy</code></div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
usePageSeo({})
</script>
