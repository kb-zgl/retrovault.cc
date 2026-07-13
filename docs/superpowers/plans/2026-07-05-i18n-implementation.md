# i18n Multi-Language Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add English + Simplified Chinese i18n support to RetroVault with sub-path URL strategy.

**Architecture:** Lightweight custom i18n system — no external deps. Translation JSON files lazy-loaded via dynamic import. SSR-safe using `useState`. Nuxt `pages:extend` hook duplicates all routes with `/zh` prefix. Locale middleware detects prefix and sets state (no URL rewriting). `useLocalePath()` composable for locale-aware internal links.

**Tech Stack:** Nuxt 4 SSR, TypeScript, Cloudflare (edge), Vite lazy imports

## Global Constraints

- English (en) = default locale, no URL prefix. Chinese (zh) = `/zh/` prefix
- Existing English output must be IDENTICAL after migration (English JSON mirrors current text)
- All translation keys use dot notation: `t('nav.games')`
- `SITE_NAME` = 'RetroVault' = brand, never translated
- Game data (titles, descriptions) stays English — UI text only
- SSR must produce matching HTML for both locales
- API routes `/api/*` and static assets unaffected by locale middleware
- Cookie `locale` for persistence, `Accept-Language` for first-visit detection
- `/zh/*` URLs must stay in address bar (no redirect to clean URL)

---

### Task 1: Translation Files + Type Safety

**Files:**
- Create: `locales/en.json`
- Create: `locales/zh.json`
- Create: `types/i18n.ts`

- [ ] **Step 1: Create `types/i18n.ts`**

```typescript
// types/i18n.ts
type TranslationKey =
  | `nav.${'home' | 'games' | 'tags' | 'news' | 'about'}`
  | `hero.${'title' | 'sub' | 'count'}`
  | `section.${'recent' | 'featured' | 'emulators' | 'viewAll'}`
  | `game.${'playNow' | 'inQueue' | 'addQueue' | 'removeQueue' | 'comments' | 'noComments' | 'post' | 'genre' | 'platform' | 'year' | 'developer' | 'publisher' | 'loadingEmulator'}`
  | `comment.${'placeholderName' | 'placeholderContent' | 'anonymous'}`
  | `filter.${'genre' | 'platform' | 'year' | 'all' | 'clear' | 'results'}`
  | `platformPage.${'title' | 'description' | 'browseAll'}`
  | `tagCloud.${'title' | 'description'}`
  | `fab.${'nowPlaying' | 'playing' | 'random' | 'queue' | 'history' | 'resume' | 'pause' | 'quickPlay' | 'emptyQueue'}`
  | `footer.${'playersOnline' | 'login' | 'about' | 'privacy' | 'guestbook'}`
  | `auth.${'login' | 'logout' | 'magicLink' | 'emailPlaceholder' | 'sendLink' | 'checkEmail' | 'username'}`
  | `theme.${'light' | 'dark'}`
  | `common.${'loading' | 'error' | 'notFound' | 'notFoundDesc'}`
  | `seo.${'tagline' | 'homeTitle' | 'homeDesc' | 'gamesTitle' | 'gamesDesc' | 'privacyTitle' | 'privacyDesc' | 'aboutTitle' | 'aboutDesc' | 'newsTitle' | 'newsDesc' | 'tagsTitle' | 'tagsDesc' | 'ogTypeHome' | 'ogTypeCategory' | 'ogTypeDetail' | 'ogTypeBlog' | 'ogTypePage'}`

export type { TranslationKey }
```

- [ ] **Step 2: Create `locales/en.json`**

Full English translations file (~80 keys matching current site text):
- `nav`: home, games, tags, news, about
- `hero`: title ("Explore All Games"), sub, count
- `section`: recent, featured, emulators, viewAll
- `game`: playNow, inQueue, addQueue, removeQueue, comments, noComments, post, genre, platform, year, developer, publisher, loadingEmulator
- `comment`: placeholderName ("Your name"), placeholderContent ("Write a comment..."), anonymous ("Anonymous")
- `filter`: genre, platform, year, all, clear, results
- `platformPage`: title ("{platform} Games"), description, browseAll ("Browse All Games")
- `tagCloud`: title ("Tag Cloud"), description
- `fab`: nowPlaying ("Now Playing"), playing, random ("Random"), queue ("Queue ({count})"), history ("History"), resume ("Resume"), pause ("Pause"), quickPlay ("Quick play"), emptyQueue
- `footer`: playersOnline ("Players online {count}"), login, about, privacy, guestbook
- `auth`: login, logout, magicLink, emailPlaceholder ("Enter your email"), sendLink ("Send Magic Link"), checkEmail, username
- `theme`: light ("Light"), dark ("Dark")
- `common`: loading ("Loading..."), error ("Error"), notFound ("Game Not Found"), notFoundDesc
- `seo`: tagline, homeTitle, homeDesc, gamesTitle, gamesDesc, aboutTitle, aboutDesc, newsTitle, newsDesc, privacyTitle, privacyDesc, tagsTitle, tagsDesc, ogTypeHome ("Home"), ogTypeCategory ("Category"), ogTypeDetail ("Detail"), ogTypeBlog ("Blog"), ogTypePage ("Page")

- [ ] **Step 3: Create `locales/zh.json`**

Chinese translations matching all keys from en.json structure.

- [ ] **Step 4: Commit**

```bash
git add locales/ types/i18n.ts
git commit -m "feat(i18n): add translation files and types"
```

---

### Task 2: useI18n Composable

**Files:**
- Create: `composables/useI18n.ts`

- [ ] **Step 1: Create `composables/useI18n.ts`**

```typescript
import type { TranslationKey } from '~/types/i18n'

export function useI18n() {
  const locale = useState<'en' | 'zh'>('locale', () => 'en')
  const translations = useState<Record<string, any>>('translations', () => ({}))

  async function setLocale(lang: 'en' | 'zh') {
    locale.value = lang
    const data = await import(`~/locales/${lang}.json`)
    translations.value = data.default || data
    const cookie = useCookie('locale', { path: '/', sameSite: 'lax' })
    cookie.value = lang
  }

  function t(key: TranslationKey, params?: Record<string, string | number>): string {
    const value = key.split('.').reduce((obj: any, k: string) => obj?.[k], translations.value)
    if (!value) return key
    if (!params) return String(value)
    return String(value).replace(/\{(\w+)\}/g, (_: string, k: string) => String(params[k] ?? ''))
  }

  return { locale, t, setLocale }
}
```

- [ ] **Step 2: Commit**

```bash
git add composables/useI18n.ts
git commit -m "feat(i18n): add useI18n composable"
```

---

### Task 3: Route Duplication (pages:extend) + Locale Middleware

**Files:**
- Modify: `nuxt.config.ts`
- Create: `middleware/locale.ts`

#### Routing Architecture

Nuxt file-based routing creates pages from `/pages/` directory. To support both `/games` and `/zh/games`, we use the `pages:extend` hook to clone all routes with `/zh` prefix:

```
Without hook:          With hook:
/games                 /games
/about                 /about
                       /zh/games    ← cloned, same component
                       /zh/about    ← cloned, same component
```

This means Nuxt's router natively understands `/zh/games` as a valid route that renders the same component as `/games`. The middleware only needs to detect the prefix and set locale state — no URL rewriting or redirects needed.

- [ ] **Step 1: Add `pages:extend` hook to `nuxt.config.ts`**

```typescript
// nuxt.config.ts — add to existing config
export default defineNuxtConfig({
  // ... existing config ...

  hooks: {
    'pages:extend'(pages) {
      // Duplicate all user-facing pages with /zh prefix for Chinese locale
      const zhPages = pages
        .filter(p => !p.path.startsWith('/api/'))
        .map(p => ({
          ...p,
          path: `/zh${p.path === '/' ? '' : p.path}`,
          name: p.name ? `${p.name}-zh` : undefined,
        }))
      pages.push(...zhPages)
    },
  },
})
```

- [ ] **Step 2: Create `middleware/locale.ts`**

```typescript
// middleware/locale.ts
export default defineNuxtRouteMiddleware(async (to) => {
  // Skip API routes and static assets
  if (to.path.startsWith('/api/') || to.path.startsWith('/roms/') || to.path.startsWith('/covers/') || to.path.startsWith('/_nuxt/') || to.path.startsWith('/favicon')) {
    return
  }

  const locale = useState<'en' | 'zh'>('locale', () => 'en')
  const translations = useState<Record<string, any>>('translations', () => ({}))

  // Detect from URL prefix
  if (to.path.startsWith('/zh')) {
    locale.value = 'zh'
    const cookie = useCookie('locale', { path: '/', sameSite: 'lax' })
    cookie.value = 'zh'
    // Lazy-load Chinese translations
    if (!translations.value?.nav?.home) {
      const data = await import(`~/locales/zh.json`)
      translations.value = data.default || data
    }
    return // URL stays /zh/..., no redirect
  }

  // No /zh prefix — check cookie
  const cookie = useCookie('locale', { path: '/', sameSite: 'lax' })

  if (cookie.value === 'zh') {
    // User prefers Chinese but URL has no /zh prefix → redirect
    locale.value = 'zh'
    if (!translations.value?.nav?.home) {
      const data = await import(`~/locales/zh.json`)
      translations.value = data.default || data
    }
    const target = `/zh${to.path === '/' ? '' : to.path}${to.query ? '?' + new URLSearchParams(to.query as any).toString() : ''}`
    return navigateTo(target, { redirectCode: 301 })
  }

  // First visit or cookie=en — detect browser language
  if (!cookie.value) {
    const headers = useRequestHeaders(['accept-language'])
    const acceptLang = headers['accept-language'] || ''
    if (acceptLang.startsWith('zh')) {
      cookie.value = 'zh'
      locale.value = 'zh'
      if (!translations.value?.nav?.home) {
        const data = await import(`~/locales/zh.json`)
        translations.value = data.default || data
      }
      const target = `/zh${to.path === '/' ? '' : to.path}${to.query ? '?' + new URLSearchParams(to.query as any).toString() : ''}`
      return navigateTo(target, { redirectCode: 302 })
    }
  }

  // Default: English
  locale.value = 'en'
  cookie.value = 'en'
  if (!translations.value?.nav?.home) {
    const data = await import(`~/locales/en.json`)
    translations.value = data.default || data
  }
})
```

- [ ] **Step 3: Register middleware in `nuxt.config.ts`**

```typescript
  // Add to existing config
  router: {
    middleware: ['locale'],
  },
```

- [ ] **Step 4: Commit**

```bash
git add middleware/locale.ts nuxt.config.ts
git commit -m "feat(i18n): add route duplication + locale middleware"
```

---

### Task 4: useLocalePath Composable

**Files:**
- Create: `composables/useLocalePath.ts`

This composable generates locale-prefixed paths for internal links. When locale is `zh`, it prepends `/zh` to all paths. When locale is `en`, returns clean path.

- [ ] **Step 1: Create `composables/useLocalePath.ts`**

```typescript
// composables/useLocalePath.ts
export function useLocalePath() {
  const { locale } = useI18n()

  function localePath(path: string): string {
    if (locale.value === 'zh' && !path.startsWith('/zh')) {
      return `/zh${path === '/' ? '' : path}`
    }
    return path
  }

  return { localePath }
}
```

- [ ] **Step 2: Commit**

```bash
git add composables/useLocalePath.ts
git commit -m "feat(i18n): add localePath composable for internal links"
```

---

### Task 5: App.vue Footer + AppHeader Migration

**Files:**
- Modify: `app.vue`
- Modify: `components/layout/AppHeader.vue`

- [ ] **Step 1: Update `app.vue`**

Add to script:
```typescript
const { t } = useI18n()
const { localePath } = useLocalePath()
```

Replace footer links:
```vue
<div class="footer-links">
  <button class="link-btn" @click="authAction">
    {{ isLoggedIn ? '👤 ' + user?.username : '🔑 ' + t('footer.login') }}
  </button>
  <NuxtLink class="link-btn" :to="localePath('/about')">{{ '📖 ' + t('footer.about') }}</NuxtLink>
  <NuxtLink class="link-btn" :to="localePath('/privacy')">{{ '🔒 ' + t('footer.privacy') }}</NuxtLink>
</div>
```

Replace players online text:
```vue
<span>{{ t('footer.playersOnline', { count: onlineCount }) }}</span>
```

- [ ] **Step 2: Update `AppHeader.vue`**

Add to script:
```typescript
const { t } = useI18n()
const { localePath } = useLocalePath()
```

- Replace all nav text with `t()` calls
- Replace all NuxtLink `to` attributes with `localePath()`:
  - `to="/"` → `:to="localePath('/')"`
  - `to="/games"` → `:to="localePath('/games')"`
  - `to="/tags"` → `:to="localePath('/tags')"`
  - `to="/news"` → `:to="localePath('/news')"`
  - `to="/about"` → `:to="localePath('/about')"`
- Replace theme toggle text with `t('theme.light')` / `t('theme.dark')`
- Replace guestbook/login text with `t()` calls

- [ ] **Step 3: Commit**

```bash
git add app.vue components/layout/AppHeader.vue
git commit -m "feat(i18n): migrate app.vue and AppHeader text"
```

---

### Task 6: Homepage Migration

**Files:**
- Modify: `pages/index.vue`

- [ ] **Step 1: Add i18n imports and replace text**

```typescript
const { t } = useI18n()
const { localePath } = useLocalePath()
```

Replace hardcoded strings:
- `"Explore All Games"` → `t('hero.title')` (in script for useSeoMeta)
- `"— Tap to enter the pixel vault —"` → `{{ t('hero.sub') }}`
- `games` in count → `{{ t('hero.count', { count: totalAll }) }}`
- `🔄 Recent` → `🔄 {{ t('section.recent') }}`
- `View all →` → `{{ t('section.viewAll') }}`
- `⭐ Featured` → `⭐ {{ t('section.featured') }}`
- `🕹️ Emulators` → `🕹️ {{ t('section.emulators') }}`

Replace NuxtLink `to` with `:to="localePath(...)"` for internal links.

Replace SEO meta with `t('seo.homeTitle')`, `t('seo.homeDesc')` etc.

- [ ] **Step 2: Commit**

```bash
git add pages/index.vue
git commit -m "feat(i18n): migrate homepage text"
```

---

### Task 7: Game List Page Migration

**Files:**
- Modify: `pages/games/index.vue`

- [ ] **Step 1: Replace hardcoded UI strings**

Add `useI18n()` and `useLocalePath()` to script.

Replace:
- `📂 Genre` → `📂 {{ t('filter.genre') }}`
- `🖥️ Platform` → `🖥️ {{ t('filter.platform') }}`
- `📅 Year` → `📅 {{ t('filter.year') }}`
- `All` → `{{ t('filter.all') }}`
- `Clear filters` → `{{ t('filter.clear') }}`
- `{{ total }} games` → `{{ t('filter.results', { count: total }) }}`

Replace all NuxtLink `to="/games"` with `:to="localePath('/games')"`.
Replace filter click handlers: genre/platform/year clicks should use `localePath` for URL updates.

Replace SEO meta:
```typescript
useSeoMeta({
  title: t('seo.gamesTitle'),
  description: t('seo.gamesDesc'),
  ogTitle: t('seo.gamesTitle'),
  ogDescription: t('seo.gamesDesc'),
  ogType: 'website',
})
```

- [ ] **Step 2: Commit**

```bash
git add pages/games/index.vue
git commit -m "feat(i18n): migrate game list page text"
```

---

### Task 8: Game Detail Page Migration

**Files:**
- Modify: `pages/games/[slug].vue`

- [ ] **Step 1: Replace hardcoded strings**

Add `useI18n()` and `useLocalePath()`.

Replace:
- `"Loading..."` → `t('common.loading')` (in pageTitle computed)
- `"RetroVault"` → `t('seo.tagline')` (fallback)
- `"Game Not Found"` → `{{ t('common.notFound') }}`
- Not found description → `{{ t('common.notFoundDesc', { slug: $route.params.slug }) }}`
- `🕹️ Play Now` → `🕹️ {{ t('game.playNow') }}`
- `✅ In Queue` / `➕ Queue` → `{{ inQueue ? t('game.inQueue') : t('game.addQueue') }}`
- `💬 Comments` → `💬 {{ t('game.comments') }}`
- `{{ comments.length }}` stays (numeric)
- `No comments yet` → `{{ t('game.noComments') }}`
- `✏️ Post` → `✏️ {{ t('game.post') }}`
- Placeholder "Your name" → `t('comment.placeholderName')`
- Placeholder "Write a comment..." → `t('comment.placeholderContent')`
- `"Anonymous"` → `t('comment.anonymous')`

Breadcrumb:
- `{ label: 'Home', to: '/' }` → `{ label: t('nav.home'), to: localePath('/') }`
- `{ label: 'Games', to: '/games' }` → `{ label: t('nav.games'), to: localePath('/games') }`

NuxtLink genre/platform links → use localePath.

SEO schema.org label `'Loading...'` → `t('common.loading')`.

- [ ] **Step 2: Commit**

```bash
git add pages/games/[slug].vue
git commit -m "feat(i18n): migrate game detail page text"
```

---

### Task 9: Platform Page + Tags Page + About Page

**Files:**
- Modify: `pages/[platform]-games.vue`
- Modify: `pages/tags.vue`
- Modify: `pages/about.vue`

- [ ] **Step 1: Migrate `[platform]-games.vue`**

Add `useI18n()`, `useLocalePath()`.
- Replace hardcoded title/description with `t('platformPage.title', { platform })`, `t('platformPage.description', { platform })`
- "Browse All Games" → `t('platformPage.browseAll')`
- NuxtLink → localePath()
- SEO meta → `t()` calls

- [ ] **Step 2: Migrate `tags.vue`**

Add `useI18n()`, `useLocalePath()`.
- Static text → `t('tagCloud.title')`, `t('tagCloud.description')`
- NuxtLink → localePath()
- SEO → `t()` calls

- [ ] **Step 3: Migrate `about.vue`**

Add `useI18n()`.
- Replace hardcoded section texts with t() calls
- Add about-related keys to translation JSONs:
  ```json
  "about": {
    "title": "About",
    "subtitle": "Pixel Heart",
    "para1": "🎮 RETRO VAULT is a retro gaming site...",
    "para2": "📅 Founded in 2026..."
  }
  ```
- Team member roles → t() calls (Founder → `t('about.roleFounder')`, etc.)
- SEO → `t()` calls

- [ ] **Step 4: Commit**

```bash
git add pages/[platform]-games.vue pages/tags.vue pages/about.vue
git commit -m "feat(i18n): migrate platform, tags, about pages"
```

---

### Task 10: GameFAB + GameEmulator Migration

**Files:**
- Modify: `components/game/GameFAB.vue`
- Modify: `components/game/GameEmulator.vue`

- [ ] **Step 1: Migrate `GameFAB.vue`**

Add `useI18n()`, `useLocalePath()`.
- `"● Now Playing"` → `{{ t('fab.nowPlaying') }}`
- `"▶ PLAYING"` → `{{ t('fab.playing') }}`
- `"🎲 Random"` → `{{ t('fab.random') }}`
- `"⏭ Queue (")` + `queue.count.value` + `")"` → `{{ t('fab.queue', { count: queue.count.value }) }}`
- `"🕹️ History"` → `{{ t('fab.history') }}`
- fabTitle: `'Resume'` → `t('fab.resume')`, `'Pause'` → `t('fab.pause')`, `'Quick play'` → `t('fab.quickPlay')`
- `alert('Queue is empty!...')` → `alert(t('fab.emptyQueue'))`
- All `router.push('/games/...')` → `router.push(localePath('/games/' + slug))`

- [ ] **Step 2: Migrate `GameEmulator.vue`**

Add `useI18n()`.
- `"Loading emulator..."` → `{{ t('game.loadingEmulator') }}`

- [ ] **Step 3: Commit**

```bash
git add components/game/GameFAB.vue components/game/GameEmulator.vue
git commit -m "feat(i18n): migrate GameFAB and GameEmulator text"
```

---

### Task 11: AuthModal + Other Components Migration

**Files:**
- Modify: `components/auth/AuthModal.vue`
- Modify: `components/game/GameCard.vue`
- Modify: `components/layout/ThemeToggle.vue`
- Modify: `components/layout/AuthButton.vue`

- [ ] **Step 1: Migrate `AuthModal.vue`**

Add `useI18n()`. Replace all hardcoded text with t() keys:
- Login/logout → `t('auth.login')` / `t('auth.logout')`
- Magic link → `t('auth.magicLink')`
- Email placeholder → `t('auth.emailPlaceholder')`
- Send button → `t('auth.sendLink')`
- Check email → `t('auth.checkEmail')`
- Username → `t('auth.username')`

- [ ] **Step 2: Migrate `GameCard.vue`**, **`ThemeToggle.vue`**, **`AuthButton.vue`**

Add `useI18n()` where needed. Replace any hardcoded text.

- [ ] **Step 3: Commit**

```bash
git add components/auth/AuthModal.vue components/game/GameCard.vue components/layout/ThemeToggle.vue components/layout/AuthButton.vue
git commit -m "feat(i18n): migrate auth and remaining component text"
```

---

### Task 12: SEO Integration (usePageSeo + hreflang)

**Files:**
- Modify: `composables/usePageSeo.ts`
- Modify: `app.vue`

- [ ] **Step 1: Update `usePageSeo.ts`**

Import and integrate i18n:
```typescript
// Top of file
import type { TranslationKey } from '~/types/i18n'

const SITE_NAME = 'RetroVault'  // brand, stays untranslated

// Inside usePageSeo function:
const { t, locale } = useI18n()

// Replace TAGLINE constant usage with t('seo.tagline')
// Replace OG_TYPE_LABEL with t() calls:
//   'Home' → t('seo.ogTypeHome')
//   'Category' → t('seo.ogTypeCategory')
//   etc.

// Add hreflang alternates:
const route = useRoute()
const currentPath = computed(() => {
  const path = route.fullPath
  return path.replace(/^\/zh/, '') || '/'
})

useHead({
  link: computed(() => [
    { rel: 'alternate', hreflang: 'en', href: `https://retrovault.online${currentPath.value}` },
    { rel: 'alternate', hreflang: 'zh', href: `https://retrovault.online/zh${currentPath.value}` },
    { rel: 'alternate', hreflang: 'x-default', href: `https://retrovault.online${currentPath.value}` },
  ]),
})

// Add og:locale
const ogLocaleMap: Record<string, string> = { en: 'en_US', zh: 'zh_CN' }
useSeoMeta({
  ogLocale: computed(() => ogLocaleMap[locale.value] || 'en_US'),
})
```

- [ ] **Step 2: Add hreflang fallback in `app.vue`** (belt-and-suspenders)

Add hreflang links inside the existing `useHead()` call in app.vue, ensuring coverage on all pages.

- [ ] **Step 3: Commit**

```bash
git add composables/usePageSeo.ts app.vue
git commit -m "feat(i18n): add multi-language SEO (hreflang, og:locale)"
```

---

### Task 13: LocaleSwitcher Component

**Files:**
- Create: `components/layout/LocaleSwitcher.vue`

- [ ] **Step 1: Create `LocaleSwitcher.vue`**

```vue
<template>
  <select
    class="locale-switcher"
    :value="locale"
    @change="switchLocale(($event.target as HTMLSelectElement).value)"
    aria-label="Switch language"
  >
    <option value="en">🇬🇧 EN</option>
    <option value="zh">🇨🇳 中文</option>
  </select>
</template>

<script setup lang="ts">
const { locale, setLocale } = useI18n()
const route = useRoute()
const router = useRouter()

async function switchLocale(lang: 'en' | 'zh') {
  // Get current path without locale prefix
  const currentPath = route.fullPath.replace(/^\/zh/, '') || '/'
  const newPath = lang === 'zh' ? `/zh${currentPath === '/' ? '' : currentPath}` : currentPath
  await setLocale(lang)
  await router.push(newPath)
}
</script>

<style scoped>
.locale-switcher {
  background: var(--color-bg-elevated);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 4px 8px;
  font-family: var(--font-body);
  font-size: 12px;
  cursor: pointer;
  appearance: auto;
}
.locale-switcher:focus {
  outline: none;
  border-color: var(--color-accent);
}
</style>
```

- [ ] **Step 2: Add LocaleSwitcher to `AppHeader.vue`**

Place in desktop nav next to ThemeToggle:
```vue
<div class="hidden sm:flex items-center gap-2">
  <LocaleSwitcher />
  <ThemeToggle />
</div>
```

Also add to mobile overlay footer:
```vue
<div class="nav-overlay-footer">
  <LocaleSwitcher />
  <!-- existing buttons -->
</div>
```

- [ ] **Step 3: Commit**

```bash
git add components/layout/LocaleSwitcher.vue components/layout/AppHeader.vue
git commit -m "feat(i18n): add LocaleSwitcher component"
```

---

### Task 14: News + Privacy Pages

**Files:**
- Modify: `pages/news.vue`
- Modify: `pages/privacy.vue`

- [ ] **Step 1: Migrate `news.vue`**

Add `useI18n()`, `useLocalePath()`. Replace hardcoded text and SEO meta.

- [ ] **Step 2: Migrate `privacy.vue`**

Content comes from Nuxt Content markdown — no translation needed for body text. Just update page title/SEO meta to use t().

- [ ] **Step 3: Commit**

```bash
git add pages/news.vue pages/privacy.vue
git commit -m "feat(i18n): migrate news and privacy page text"
```

---

### Task 15: Verification

- [ ] **Step 1: Start dev server**

```bash
pnpm dev
```

- [ ] **Step 2: Test English rendering**

- Visit `/` — verify all text matches pre-i18n output (identical)
- Visit `/games` — filters, pagination, results text correct
- Visit `/games/contra` — detail page, play button, comments section
- Check FAB panel opens with correct labels
- Check emulator loading text

- [ ] **Step 3: Test Chinese (`/zh/` routes)**

- Visit `/zh/games` — all UI text in Chinese, URL stays `/zh/games`
- Verify filters, breadcrumbs, buttons display Chinese text
- Visit `/zh/games/contra` — Chinese UI, English game data (correct)
- Check FAB panel in Chinese
- LocaleSwitcher switches correctly between EN / 中文

- [ ] **Step 4: Test browser detection**

- Clear all cookies
- Set browser to zh-CN Accept-Language
- Visit `/` → should 302 redirect to `/zh/` (or `/zh` → `/zh/`)
- Clear cookies, set browser to en-US
- Visit `/` → stays on `/` (no redirect)

- [ ] **Step 5: Test persistence**

- Switch to Chinese via LocaleSwitcher
- Navigate to 2-3 pages — locale persists, URL stays `/zh/*`
- Close tab, reopen — still Chinese (cookie)
- Switch back to English — URL returns to clean paths

- [ ] **Step 6: Test SSR**

- View page source on English pages — text rendered server-side, not JS
- View page source on `/zh/games` — Chinese text in HTML
- hreflang alternate links present in `<head>` on both versions
- `og:locale` matches current language

- [ ] **Step 7: Test edge cases**

- `/zh` (bare) → should work (routes to `/zh/` equivalent)
- `/api/games` → returns JSON, not affected by locale middleware
- 404 page renders in correct locale
- Missing translation key → falls back to key name (visible for debugging)
- `/zh/games/contra` direct deep link → loads Chinese UI correctly
- Game data (title, description) stays English even on `/zh/*` pages

- [ ] **Step 8: Commit any fixes**

```bash
git add -A
git commit -m "fix(i18n): verification fixes"
```
