# Admin Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a passwordless admin panel for managing game data, supporting multi-language content entry and cover image uploads.

**Architecture:** Nuxt 4 server routes + D1 for storage, existing magic-link JWT auth + admin email whitelist for access control, existing dark theme UI components for admin pages.

**Tech Stack:** Nuxt 4 (SSR), Tailwind CSS v4, Cloudflare D1, Cloudflare R2, jose (JWT), existing magic-link auth

## Global Constraints

- All admin pages behind auth with admin role check
- API routes under `/api/admin/*` require valid admin JWT
- D1 table `games` uses single-table schema (langs JSON for translations, controls/longDesc inside each locale)
- Cloudflare Workers constraint: no filesystem writes in production
- Existing UI patterns: `.card`, `.btn-pixel`, `--color-*` tokens from main.css
- Existing auth: magic-link + JWT via `server/utils/jwt.ts` and `server/utils/kv.ts`

---

### Task 1: D1 Database Setup + Schema

**Files:**
- Create: `server/utils/d1.ts`
- Create: `scripts/init-d1.sql`
- Create: `scripts/import-to-d1.mjs`

**Interfaces:**
- Consumes: N/A (foundation task)
- Produces: `useD1()` → D1 binding, `sql` helper for queries, `data/games/*.json` → D1 import

- [ ] **Step 1: Write D1 connection utility**

```ts
// server/utils/d1.ts
import { defineEventHandler } from 'h3'

let _db: D1Database | null = null

export function useD1(): D1Database {
  if (_db) return _db
  // In development with wrangler, hubDatabase() or process.env.DB binding
  // In production, the D1 binding is available via process.env.DB
  const binding = (process.env as any).DB
  if (!binding) {
    throw createError({ statusCode: 500, statusMessage: 'D1 database not configured' })
  }
  _db = binding
  return _db
}

export async function sql(query: string, ...bindings: any[]) {
  const db = useD1()
  const stmt = db.prepare(query)
  if (bindings.length) stmt.bind(...bindings)
  const result = await stmt.run()
  return result
}

export async function sqlAll<T = any>(query: string, ...bindings: any[]): Promise<T[]> {
  const db = useD1()
  const stmt = db.prepare(query)
  if (bindings.length) stmt.bind(...bindings)
  const { results } = await stmt.all<T>()
  return results
}

export async function sqlOne<T = any>(query: string, ...bindings: any[]): Promise<T | null> {
  const db = useD1()
  const stmt = db.prepare(query)
  if (bindings.length) stmt.bind(...bindings)
  const { results } = await stmt.all<T>()
  return results.length ? results[0] : null
}
```

- [ ] **Step 2: Write D1 schema**

```sql
-- scripts/init-d1.sql
CREATE TABLE IF NOT EXISTS games (
  slug        TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  platform    TEXT NOT NULL,
  year        INTEGER,
  genre       TEXT,
  developer   TEXT,
  publisher   TEXT,
  series      TEXT,
  isHack      INTEGER DEFAULT 0,
  coverUrl    TEXT,
  defaultRom  TEXT,
  ejsCore     TEXT,
  ejsBiosUrl  TEXT,
  tags        TEXT,
  description TEXT,
  langs       TEXT,
  roms        TEXT,
  status      TEXT DEFAULT 'draft',
  source      TEXT DEFAULT 'scraped',
  createdAt   TEXT,
  updatedAt   TEXT
);

CREATE INDEX IF NOT EXISTS idx_games_platform ON games(platform);
CREATE INDEX IF NOT EXISTS idx_games_genre ON games(genre);
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
```

- [ ] **Step 3: Write import script (scraper JSON → D1)**

```js
// scripts/import-to-d1.mjs
// Usage: node scripts/import-to-d1.mjs [--slug=xxx]
// Reads data/games/*.json, upserts into D1 via wrangler d1 execute
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { execSync } from 'node:child_process'

const DATA_DIR = join(process.cwd(), 'retrovault-scraper', 'data', 'games')
const ARGS = new Set(process.argv.slice(2))
const SLUG = [...ARGS].find(a => a.startsWith('--slug='))?.split('=')[1]

const files = readdirSync(DATA_DIR).filter(f => f.endsWith('.json'))
const targetFiles = SLUG
  ? files.filter(f => f.startsWith(SLUG))
  : files

let count = 0
for (const file of targetFiles) {
  const raw = readFileSync(join(DATA_DIR, file), 'utf-8')
  const g = JSON.parse(raw)

  const title = g.title?.replace(/'/g, "''") || ''
  const platform = g.platform?.replace(/'/g, "''") || ''
  const year = g.year || null
  const genre = g.genre?.replace(/'/g, "''") || ''
  const developer = g.developer?.replace(/'/g, "''") || ''
  const publisher = g.publisher?.replace(/'/g, "''") || ''
  const series = g.series?.replace(/'/g, "''") || ''
  const isHack = g.isHack && g.isHack !== '$undefined' ? 1 : 0
  const coverUrl = g.localCover ? `/${g.localCover}` : ''
  const defaultRom = g.defaultRom || ''
  const ejsCore = g.ejs?.core || ''
  const ejsBiosUrl = g.ejs?.biosUrl || ''
  const tags = JSON.stringify(g.tags || [])
  const description = g.description?.replace(/'/g, "''") || ''
  const roms = JSON.stringify(g.localRoms || [])
  const now = new Date().toISOString()

  // Build langs from existing translations or empty
  const langs = JSON.stringify(g.translations || {})

  const sql = `INSERT OR REPLACE INTO games (slug, title, platform, year, genre, developer, publisher, series, isHack, coverUrl, defaultRom, ejsCore, ejsBiosUrl, tags, description, langs, roms, status, source, createdAt, updatedAt)
  VALUES (
    '${g.slug}', '${title}', '${platform}', ${year}, '${genre}', '${developer}', '${publisher}',
    '${series}', ${isHack}, '${coverUrl}', '${defaultRom}', '${ejsCore}', '${ejsBiosUrl}',
    '${tags}', '${description}', '${langs}', '${roms}',
    'published', 'scraped', '${now}', '${now}'
  );`

  // Write SQL to a temp batch file or pipe to wrangler
  try {
    execSync(`echo "${sql}" | wrangler d1 execute retro-vault --remote`, {
      stdio: 'pipe',
      timeout: 30000,
    })
    count++
    if (count % 50 === 0) console.log(`[import] ${count}/${targetFiles.length}`)
  } catch (e) {
    console.error(`[import] FAILED ${g.slug}: ${e.message}`)
  }
}

console.log(`[import] Done. ${count}/${targetFiles.length} games imported.`)
```

- [ ] **Step 4: Run schema against D1**

```bash
wrangler d1 execute retro-vault --file=scripts/init-d1.sql --remote
```
Expected: "Executing..." + success message.

- [ ] **Step 5: Commit**

```bash
git add server/utils/d1.ts scripts/init-d1.sql scripts/import-to-d1.mjs
git commit -m "feat(db): add D1 schema and import script"
```

---

### Task 2: Admin Role System

**Files:**
- Create: `server/utils/admin.ts`
- Modify: `server/api/auth/verify.get.ts`

**Interfaces:**
- Consumes: `useKv()` from `server/utils/kv.ts`, `verifyJwt()` from `server/utils/jwt.ts`
- Produces: `isAdmin(email)` → boolean, `requireAdmin(event)` → JwtPayload

- [ ] **Step 1: Write admin utility**

```ts
// server/utils/admin.ts
import { useKv } from './kv'
import { verifyJwt } from './jwt'
import type { JwtPayload } from './jwt'

const ADMIN_EMAILS_KEY = 'admin:emails'

export async function getAdminEmails(): Promise<string[]> {
  const kv = useKv()
  const raw = await kv.get(ADMIN_EMAILS_KEY)
  return raw ? JSON.parse(raw) : []
}

export async function isAdmin(email: string): Promise<boolean> {
  const admins = await getAdminEmails()
  return admins.includes(email.toLowerCase().trim())
}

export async function addAdmin(email: string): Promise<void> {
  const kv = useKv()
  const admins = await getAdminEmails()
  const normalized = email.toLowerCase().trim()
  if (!admins.includes(normalized)) {
    admins.push(normalized)
    await kv.put(ADMIN_EMAILS_KEY, JSON.stringify(admins))
  }
}

export async function removeAdmin(email: string): Promise<void> {
  const kv = useKv()
  const normalized = email.toLowerCase().trim()
  const admins = (await getAdminEmails()).filter(e => e !== normalized)
  await kv.put(ADMIN_EMAILS_KEY, JSON.stringify(admins))
}

/** Require valid admin JWT from Authorization header. Returns payload on success, throws 401/403 on failure. */
export async function requireAdmin(event: any): Promise<JwtPayload> {
  const auth = getHeader(event, 'authorization')
  if (!auth || !auth.startsWith('Bearer ')) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  let payload: JwtPayload
  try {
    payload = await verifyJwt(auth.slice(7))
  } catch {
    throw createError({ statusCode: 401, statusMessage: 'Invalid or expired token' })
  }

  if (!(await isAdmin(payload.email))) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden: admin access required' })
  }

  return payload
}
```

- [ ] **Step 2: Modify verify endpoint to seed initial admin**

In `server/api/auth/verify.get.ts`, after user creation, add admin check:

```ts
// After finding or creating user (around line 57-58)
import { addAdmin, isAdmin } from '../../utils/admin'

// After `await kv.put(userKey, JSON.stringify(newUser))`
// Auto-promote first user or configured admin
const initialAdmin = process.env.ADMIN_EMAIL
if (initialAdmin && normalized === initialAdmin.toLowerCase().trim()) {
  await addAdmin(normalized)
}
```

And in the response section, add `role` to user metadata:

```ts
// Before signing JWT
const admin = await isAdmin(email)
// In jwt signing, add isAdmin to payload or set a claim
const role = admin ? 'admin' : 'user'
```

- [ ] **Step 3: Commit**

```bash
git add server/utils/admin.ts server/api/auth/verify.get.ts
git commit -m "feat(auth): add admin role system with KV-backed whitelist"
```

---

### Task 3: Admin API Routes — Games CRUD

**Files:**
- Create: `server/api/admin/games.get.ts`
- Create: `server/api/admin/games/[slug].get.ts`
- Create: `server/api/admin/games/[slug].put.ts`

**Interfaces:**
- Consumes: `requireAdmin()` from `server/utils/admin.ts`, `useD1()/sqlAll()/sqlOne()` from `server/utils/d1.ts`
- Produces: REST endpoints for admin game management

- [ ] **Step 1: GET /api/admin/games — list games with filters**

```ts
// server/api/admin/games.get.ts
import { requireAdmin } from '../../utils/admin'
import { sqlAll } from '../../utils/d1'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const query = getQuery(event)

  let where = '1=1'
  const params: any[] = []

  if (query.platform) { where += ' AND platform = ?'; params.push(query.platform) }
  if (query.status) { where += ' AND status = ?'; params.push(query.status) }
  if (query.search) { where += ' AND (title LIKE ? OR slug LIKE ?)'; params.push(`%${query.search}%`, `%${query.search}%`) }

  const page = Math.max(1, parseInt(query.page as string) || 1)
  const limit = Math.min(200, Math.max(1, parseInt(query.limit as string) || 48))
  const offset = (page - 1) * limit

  const games = await sqlAll(`SELECT slug, title, platform, year, genre, status, coverUrl, source FROM games WHERE ${where} ORDER BY updatedAt DESC LIMIT ? OFFSET ?`, ...params, limit, offset)
  const [{ total }] = await sqlAll(`SELECT COUNT(*) as total FROM games WHERE ${where}`, ...params)

  // Get filter options from data files
  const genres = JSON.parse(readFileSync('./data/genres.json', 'utf-8'))
  const platforms = JSON.parse(readFileSync('./data/platforms.json', 'utf-8'))

  return {
    total: total,
    page,
    limit,
    games,
    filters: {
      platforms: Object.keys(platforms.en),
      genres: Object.keys(genres.en),
      statuses: ['draft', 'published'],
    }
  }
})
```

- [ ] **Step 2: GET /api/admin/games/:slug — single game full data**

```ts
// server/api/admin/games/[slug].get.ts
import { requireAdmin } from '../../../utils/admin'
import { sqlOne } from '../../../utils/d1'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const { slug } = getRouterParams(event)
  const game = await sqlOne('SELECT * FROM games WHERE slug = ?', slug)
  if (!game) throw createError({ statusCode: 404, statusMessage: 'Game not found' })

  // Parse JSON string fields
  if (typeof game.tags === 'string') game.tags = JSON.parse(game.tags)
  if (typeof game.langs === 'string') game.langs = JSON.parse(game.langs)
  if (typeof game.roms === 'string') game.roms = JSON.parse(game.roms)

  return game
})
```

- [ ] **Step 3: PUT /api/admin/games/:slug — save game data**

```ts
// server/api/admin/games/[slug].put.ts
import { requireAdmin } from '../../../utils/admin'
import { useD1 } from '../../../utils/d1'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const { slug } = getRouterParams(event)
  const body = await readBody(event)

  const now = new Date().toISOString()
  const db = useD1()

  // Prepare fields (only allowlisted fields can be updated)
  const allowed = ['title','platform','year','genre','developer','publisher','series',
    'isHack','coverUrl','defaultRom','ejsCore','ejsBiosUrl','tags','description','langs','roms','status']

  const updates: string[] = []
  const values: any[] = []

  for (const key of allowed) {
    if (body[key] !== undefined) {
      updates.push(`${key} = ?`)
      values.push(typeof body[key] === 'object' ? JSON.stringify(body[key]) : body[key])
    }
  }

  if (updates.length === 0) throw createError({ statusCode: 400, statusMessage: 'No valid fields to update' })

  updates.push('updatedAt = ?')
  values.push(now)
  values.push(slug)

  const stmt = db.prepare(`UPDATE games SET ${updates.join(', ')} WHERE slug = ?`)
  await stmt.bind(...values).run()

  return { success: true, slug }
})
```

- [ ] **Step 4: Commit**

```bash
git add server/api/admin/
git commit -m "feat(api): add admin games CRUD endpoints"
```

---

### Task 4: Admin Pages — Layout + Dashboard

**Files:**
- Create: `pages/admin.vue` (parent layout)
- Create: `pages/admin/index.vue` (dashboard)
- Create: `pages/admin/games.vue` (game list)
- Create: `composables/useAdmin.ts`

**Interfaces:**
- Consumes: existing auth JWT from localStorage, `GET /api/admin/games`, existing `.card`/`.btn-pixel` CSS classes
- Produces: Admin UI

- [ ] **Step 1: Write admin auth composable**

```ts
// composables/useAdmin.ts
export function useAdmin() {
  const token = ref<string | null>(null)
  const user = ref<any>(null)
  const isAdmin = computed(() => !!user.value)

  async function checkAuth() {
    const t = localStorage.getItem('app-token')
    if (!t) return false
    token.value = t
    try {
      const res = await $fetch('/api/auth/me', {
        headers: { authorization: `Bearer ${t}` }
      })
      user.value = res
      // Check if user has admin role — the backend returns role field
      if (!res.role || res.role !== 'admin') {
        user.value = null
        return false
      }
      return true
    } catch {
      user.value = null
      return false
    }
  }

  function adminFetch(url: string, opts?: any) {
    return $fetch(url, {
      ...opts,
      headers: {
        ...opts?.headers,
        authorization: token.value ? `Bearer ${token.value}` : '',
      }
    })
  }

  return { token, user, isAdmin, checkAuth, adminFetch }
}
```

- [ ] **Step 2: Create admin layout page**

```vue
<!-- pages/admin.vue -->
<template>
  <div class="admin-layout" style="background:var(--color-bg-base);min-height:100vh">
    <!-- Admin Nav -->
    <header class="admin-nav" style="background:var(--color-bg-elevated);border-bottom:1px solid var(--color-border);padding:12px 24px;display:flex;align-items:center;gap:24px">
      <NuxtLink to="/admin" class="font-pixel" style="color:var(--color-accent);font-size:0.75rem;text-decoration:none">RetroVault Admin</NuxtLink>
      <nav style="display:flex;gap:16px;flex:1">
        <NuxtLink to="/admin" class="font-body" style="color:var(--color-text-secondary);font-size:0.8rem;text-decoration:none">Dashboard</NuxtLink>
        <NuxtLink to="/admin/games" class="font-body" style="color:var(--color-text-secondary);font-size:0.8rem;text-decoration:none">Games</NuxtLink>
      </nav>
      <button @click="logout" class="font-body" style="color:var(--color-text-muted);font-size:0.75rem;background:none;border:none;cursor:pointer">Sign Out</button>
    </header>

    <!-- Main Content -->
    <main style="max-width:1200px;margin:0 auto;padding:32px 24px">
      <NuxtPage />
    </main>
  </div>
</template>

<script setup>
definePageMeta({
  middleware: ['admin-auth']
})

const router = useRouter()
function logout() {
  localStorage.removeItem('app-token')
  router.push('/')
}
</script>
```

- [ ] **Step 3: Create admin-auth middleware**

```ts
// middleware/admin-auth.ts
export default defineNuxtRouteMiddleware(async (to) => {
  if (process.client) {
    const token = localStorage.getItem('app-token')
    if (!token) return navigateTo('/')

    try {
      const res = await $fetch('/api/auth/me', {
        headers: { authorization: `Bearer ${token}` }
      })
      if (!res.role || res.role !== 'admin') return navigateTo('/')
    } catch {
      return navigateTo('/')
    }
  }
})
```

- [ ] **Step 4: Create dashboard page**

```vue
<!-- pages/admin/index.vue -->
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
        <div style="font-size:0.7rem;color:var(--color-text-secondary);margin-bottom:8px">Languages</div>
        <div style="font-size:1.8rem;font-weight:700;color:var(--color-accent-secondary)">en / zh / ja</div>
      </div>
    </div>

    <div v-if="error" style="color:var(--color-accent);font-size:0.85rem;padding:12px">Failed to load stats: {{ error.message }}</div>
  </div>
</template>

<script setup>
const { adminFetch } = useAdmin()
const { data: stats, pending, error } = useAsyncData('admin-stats', () => adminFetch('/api/admin/stats'))
</script>
```

Add stats endpoint:

```ts
// server/api/admin/stats.get.ts
import { requireAdmin } from '../../utils/admin'
import { sqlAll } from '../../utils/d1'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const [total] = await sqlAll('SELECT COUNT(*) as total FROM games')
  const [published] = await sqlAll("SELECT COUNT(*) as total FROM games WHERE status = 'published'")
  const [draft] = await sqlAll("SELECT COUNT(*) as total FROM games WHERE status = 'draft'")
  const [withZh] = await sqlAll("SELECT COUNT(*) as total FROM games WHERE langs LIKE '%\"zh\"%'")
  return {
    total: total.total,
    published: published.total,
    draft: draft.total,
    withZh: withZh.total,
  }
})
```

- [ ] **Step 5: Create games list page**

```vue
<!-- pages/admin/games.vue -->
<template>
  <div>
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px">
      <h1 style="font-size:1.2rem;font-weight:700;color:var(--color-text-primary)">Games</h1>
      <div style="display:flex;gap:8px">
        <select v-model="filter.platform" @change="load" class="filter-btn" style="padding:6px 12px;border-radius:var(--radius-sm);background:var(--color-bg-surface);border:1px solid var(--color-border);color:var(--color-text-primary)">
          <option value="">All Platforms</option>
          <option v-for="p in filters.platforms" :key="p" :value="p">{{ p }}</option>
        </select>
        <select v-model="filter.status" @change="load" class="filter-btn" style="padding:6px 12px;border-radius:var(--radius-sm);background:var(--color-bg-surface);border:1px solid var(--color-border);color:var(--color-text-primary)">
          <option value="">All Status</option>
          <option v-for="s in filters.statuses" :key="s" :value="s">{{ s }}</option>
        </select>
        <input v-model="filter.search" @input="debouncedLoad" placeholder="Search..." style="padding:6px 12px;border-radius:var(--radius-sm);background:var(--color-bg-surface);border:1px solid var(--color-border);color:var(--color-text-primary);width:200px">
      </div>
    </div>

    <div v-if="pending" class="flex flex-col gap-3">
      <div v-for="i in 8" :key="i" class="skeleton" style="height:60px;border-radius:var(--radius-sm)" />
    </div>

    <div v-else-if="error" style="color:var(--color-accent);padding:12px">Error: {{ error.message }}</div>

    <div v-else class="card" style="overflow:hidden">
      <table style="width:100%;border-collapse:collapse;font-size:0.8rem">
        <thead>
          <tr style="background:var(--color-bg-elevated);color:var(--color-text-secondary)">
            <th style="padding:12px 16px;text-align:left">Title</th>
            <th style="padding:12px 16px;text-align:left">Platform</th>
            <th style="padding:12px 16px;text-align:left">Year</th>
            <th style="padding:12px 16px;text-align:left">Genre</th>
            <th style="padding:12px 16px;text-align:left">Status</th>
            <th style="padding:12px 16px;text-align:left">Languages</th>
            <th style="padding:12px 16px;text-align:right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="g in games" :key="g.slug" style="border-top:1px solid var(--color-border)">
            <td style="padding:12px 16px">
              <NuxtLink :to="`/admin/games/${g.slug}`" style="color:var(--color-accent);text-decoration:none;font-weight:600">{{ g.title }}</NuxtLink>
              <div style="font-size:0.7rem;color:var(--color-text-muted)">{{ g.slug }}</div>
            </td>
            <td style="padding:12px 16px;color:var(--color-text-secondary)">{{ g.platform }}</td>
            <td style="padding:12px 16px;color:var(--color-text-secondary)">{{ g.year }}</td>
            <td style="padding:12px 16px;color:var(--color-text-secondary)">{{ g.genre }}</td>
            <td style="padding:12px 16px">
              <span :class="g.status === 'published' ? 'badge-green' : 'badge-yellow'" style="font-size:0.65rem">{{ g.status }}</span>
            </td>
            <td style="padding:12px 16px;color:var(--color-text-muted);font-size:0.7rem">{{ g.langs ? Object.keys(g.langs).join(', ') : 'en' }}</td>
            <td style="padding:12px 16px;text-align:right">
              <NuxtLink :to="`/admin/games/${g.slug}`" class="btn-pixel" style="padding:4px 12px;font-size:0.65rem">Edit</NuxtLink>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="total > limit" style="display:flex;justify-content:center;gap:8px;margin-top:20px">
      <button @click="page--;load()" :disabled="page <= 1" class="btn-pixel" style="padding:6px 16px;font-size:0.7rem">Prev</button>
      <span style="color:var(--color-text-secondary);padding:6px 0;font-size:0.8rem">{{ page }} / {{ Math.ceil(total / limit) }}</span>
      <button @click="page++;load()" :disabled="page * limit >= total" class="btn-pixel" style="padding:6px 16px;font-size:0.7rem">Next</button>
    </div>
  </div>
</template>

<script setup>
const { adminFetch } = useAdmin()
const debouncedLoad = useDebounceFn(() => { page.value = 1; load() }, 300)

const page = ref(1)
const limit = 48
const filter = reactive({ platform: '', status: '', search: '' })
const games = ref([])
const total = ref(0)
const filters = ref({ platforms: [], statuses: [] })
const { pending, error, refresh } = useAsyncData('admin-games', () =>
  adminFetch(`/api/admin/games?page=${page.value}&limit=${limit}&platform=${filter.platform}&status=${filter.status}&search=${filter.search}`)
    .then(r => { games.value = r.games; total.value = r.total; filters.value = r.filters; return r })
, { watch: [page] })

async function load() { await refresh() }
</script>
```

- [ ] **Step 6: Commit**

```bash
git add pages/admin/ composables/useAdmin.ts middleware/admin-auth.ts server/api/admin/stats.get.ts
git commit -m "feat(admin): add admin layout, dashboard, and games list pages"
```

---

### Task 5: Game Editor Page — Core Form + Language Tabs

**Files:**
- Create: `pages/admin/games/[slug].vue`

**Interfaces:**
- Consumes: `GET /api/admin/games/:slug`, `PUT /api/admin/games/:slug`, `data/genres.json`, `data/platforms.json`
- Produces: Full game editing UI with language tabs

- [ ] **Step 1: Create game editor page**

```vue
<!-- pages/admin/games/[slug].vue -->
<template>
  <div>
    <NuxtLink to="/admin/games" style="color:var(--color-text-secondary);font-size:0.8rem;text-decoration:none;display:inline-block;margin-bottom:16px">← Back to Games</NuxtLink>

    <div v-if="pending" class="skeleton" style="height:400px;border-radius:var(--radius-md)" />

    <div v-else-if="error" style="color:var(--color-accent);padding:20px;text-align:center">Failed to load game: {{ error.message }}</div>

    <template v-else>
      <!-- Header -->
      <div style="display:flex;align-items:center;gap:16px;margin-bottom:24px">
        <img v-if="game.coverUrl" :src="game.coverUrl" alt="" style="width:60px;height:60px;border-radius:var(--radius-sm);object-fit:cover;border:1px solid var(--color-border)">
        <div>
          <h1 style="font-size:1.1rem;font-weight:700;color:var(--color-text-primary)">{{ game.title }}</h1>
          <div style="font-size:0.75rem;color:var(--color-text-muted)">{{ game.slug }} · {{ game.platform }} · {{ game.year }}</div>
        </div>
        <div style="margin-left:auto;display:flex;gap:8px">
          <button @click="save" :disabled="saving" class="btn-pixel-green" style="padding:8px 20px;font-size:0.75rem">
            {{ saving ? 'Saving...' : 'Save' }}
          </button>
          <button @click="saveAndNext" :disabled="saving" class="btn-pixel" style="padding:8px 20px;font-size:0.75rem">
            Save & Next
          </button>
        </div>
      </div>

      <div v-if="saveSuccess" class="badge-green" style="margin-bottom:16px;padding:8px 16px">Saved successfully</div>
      <div v-if="saveError" class="badge-pink" style="margin-bottom:16px;padding:8px 16px">Save failed: {{ saveError }}</div>

      <!-- Language Tabs -->
      <div style="display:flex;gap:4px;margin-bottom:20px;border-bottom:1px solid var(--color-border);padding-bottom:8px">
        <button v-for="lang in availableLangs" :key="lang"
          @click="activeLang = lang"
          :style="{
            padding: '6px 16px',
            borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.75rem',
            fontWeight: 600,
            background: activeLang === lang ? 'var(--color-accent)' : 'var(--color-bg-elevated)',
            color: activeLang === lang ? '#fff' : 'var(--color-text-secondary)',
          }">
          {{ langLabels[lang] || lang.toUpperCase() }}
        </button>
      </div>

      <!-- Form -->
      <div class="card" style="padding:24px">
        <!-- En-only fields (always shown) -->
        <section style="margin-bottom:24px">
          <h3 style="font-size:0.85rem;font-weight:600;color:var(--color-text-primary);margin-bottom:12px">Core Fields</h3>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
            <FormField label="Title (EN)" required>
              <input v-model="form.title" class="form-input" />
            </FormField>
            <FormField label="Platform" required>
              <select v-model="form.platform" class="form-input">
                <option v-for="p in platformOptions" :key="p" :value="p">{{ p }}</option>
              </select>
            </FormField>
            <FormField label="Year">
              <input v-model.number="form.year" type="number" class="form-input" />
            </FormField>
            <FormField label="Genre">
              <select v-model="form.genre" class="form-input">
                <option value="">—</option>
                <option v-for="g in genreOptions" :key="g" :value="g">{{ g }}</option>
              </select>
            </FormField>
            <FormField label="Developer">
              <input v-model="form.developer" class="form-input" />
            </FormField>
            <FormField label="Publisher">
              <input v-model="form.publisher" class="form-input" />
            </FormField>
            <FormField label="Series">
              <input v-model="form.series" class="form-input" />
            </FormField>
            <FormField label="Status">
              <select v-model="form.status" class="form-input">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </FormField>
          </div>
        </section>

        <!-- Tags -->
        <section style="margin-bottom:24px">
          <h3 style="font-size:0.85rem;font-weight:600;color:var(--color-text-primary);margin-bottom:12px">Tags (EN)</h3>
          <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px">
            <span v-for="(tag, i) in form.tags" :key="i" class="badge-pink" style="font-size:0.65rem;padding:4px 10px;cursor:pointer" @click="form.tags.splice(i, 1)">{{ tag }} ✕</span>
          </div>
          <div style="display:flex;gap:8px">
            <input v-model="newTag" @keydown.enter.prevent="addTag" placeholder="Type tag and Enter" class="form-input" style="flex:1" />
            <button @click="addTag" class="btn-pixel" style="padding:4px 16px;font-size:0.7rem">Add</button>
          </div>
        </section>

        <!-- Language-specific fields -->
        <section>
          <h3 style="font-size:0.85rem;font-weight:600;color:var(--color-text-primary);margin-bottom:12px">{{ langLabels[activeLang] || activeLang.toUpperCase() }} Content</h3>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
            <FormField label="Title Translation">
              <input v-model="localeForm.title" class="form-input" :placeholder="activeLang === 'en' ? form.title : ''" />
            </FormField>
          </div>
          <FormField label="Short Description">
            <textarea v-model="localeForm.description" class="form-input" rows="3" :placeholder="activeLang === 'en' ? 'English description' : ''"></textarea>
          </FormField>
          <FormField label="Long Description">
            <div v-for="(para, i) in localeForm.longDesc" :key="i" style="display:flex;gap:8px;margin-bottom:8px">
              <textarea v-model="localeForm.longDesc[i]" class="form-input" rows="2" style="flex:1"></textarea>
              <button @click="localeForm.longDesc.splice(i, 1)" style="color:var(--color-accent);background:none;border:none;cursor:pointer">✕</button>
            </div>
            <button @click="localeForm.longDesc.push('')" class="btn-pixel" style="padding:4px 12px;font-size:0.65rem">+ Add paragraph</button>
          </FormField>
          <FormField label="Controls">
            <div v-for="(val, key) in localeForm.controls" :key="key" style="display:flex;gap:8px;margin-bottom:6px;align-items:center">
              <span style="font-size:0.7rem;color:var(--color-text-secondary);min-width:60px">{{ key }}</span>
              <input v-model="localeForm.controls[key]" class="form-input" style="flex:1" />
            </div>
          </FormField>
        </section>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'

definePageMeta({ middleware: ['admin-auth'] })
const route = useRoute()
const { adminFetch } = useAdmin()
const slug = route.params.slug

// Load i18n data for select options
const { data: genresData } = await useAsyncData('genres', () => $fetch('/data/genres.json'))
const { data: platformsData } = await useAsyncData('platforms', () => $fetch('/data/platforms.json'))
const genreOptions = computed(() => genresData.value ? Object.values(genresData.value.en) : [])
const platformOptions = computed(() => platformsData.value ? Object.values(platformsData.value.en) : [])

const availableLangs = ['en', 'zh', 'ja']
const langLabels = { en: 'English', zh: '中文', ja: '日本語' }
const activeLang = ref('zh')

const saving = ref(false)
const saveSuccess = ref(false)
const saveError = ref('')
const newTag = ref('')

// Main form data
const form = reactive({
  title: '', platform: '', year: null, genre: '', developer: '', publisher: '', series: '',
  status: 'draft', tags: [],
  langs: {}
})

// Active language form
const localeForm = reactive({
  title: '', description: '', longDesc: [], controls: {}, tags: []
})

// Load game data
const { data: game, pending, error } = useAsyncData(`admin-game-${slug}`, () =>
  adminFetch(`/api/admin/games/${slug}`)
)

watch(game, (g) => {
  if (!g) return
  form.title = g.title || ''
  form.platform = g.platform || ''
  form.year = g.year || null
  form.genre = g.genre || ''
  form.developer = g.developer || ''
  form.publisher = g.publisher || ''
  form.series = g.series || ''
  form.status = g.status || 'draft'
  form.tags = g.tags || []
  form.langs = g.langs || {}
  syncLocaleForm()
}, { immediate: true })

watch(activeLang, () => syncLocaleForm())

function syncLocaleForm() {
  const l = form.langs[activeLang.value] || {}
  localeForm.title = l.title || ''
  localeForm.description = l.description || ''
  localeForm.longDesc = l.longDesc || []
  localeForm.controls = l.controls || { 'D-Pad': '', 'A': '', 'B': '', 'Start': '' }
  localeForm.tags = l.tags || []
}

function addTag() {
  const t = newTag.value.trim()
  if (t && !form.tags.includes(t)) form.tags.push(t)
  newTag.value = ''
}

async function save() {
  saving.value = true
  saveSuccess.value = false
  saveError.value = ''

  // Sync localeForm back to form.langs
  form.langs[activeLang.value] = {
    title: localeForm.title,
    description: localeForm.description,
    longDesc: localeForm.longDesc,
    controls: localeForm.controls,
    tags: localeForm.tags,
  }

  try {
    await adminFetch(`/api/admin/games/${slug}`, {
      method: 'PUT',
      body: {
        title: form.title,
        platform: form.platform,
        year: form.year,
        genre: form.genre,
        developer: form.developer,
        publisher: form.publisher,
        series: form.series,
        status: form.status,
        tags: form.tags,
        langs: form.langs,
      }
    })
    saveSuccess.value = true
    setTimeout(() => { saveSuccess.value = false }, 3000)
  } catch (e) {
    saveError.value = e.message || 'Save failed'
  } finally {
    saving.value = false
  }
}

async function saveAndNext() {
  await save()
  // Navigate to next game
  const { games } = await adminFetch(`/api/admin/games?limit=1&page=1&status=${form.status}`)
  // This is simplified — in practice you'd track current index
}
</script>
```

- [ ] **Step 2: Create FormField component**

```vue
<!-- components/admin/FormField.vue -->
<template>
  <div class="form-field">
    <label style="display:block;font-size:0.7rem;color:var(--color-text-secondary);margin-bottom:4px;font-weight:600">
      {{ label }}
      <span v-if="required" style="color:var(--color-accent)">*</span>
    </label>
    <slot />
  </div>
</template>

<script setup>
defineProps<{ label: string; required?: boolean }>()
</script>
```

- [ ] **Step 3: Add form-input CSS class**

In `assets/css/main.css`:

```css
.form-input {
  width: 100%;
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  color: var(--color-text-primary);
  font-size: 0.8rem;
  font-family: var(--font-body);
  outline: none;
  transition: border-color 0.15s;
}
.form-input:focus {
  border-color: var(--color-accent);
}
.form-input::placeholder {
  color: var(--color-text-muted);
  opacity: 0.6;
}
textarea.form-input {
  resize: vertical;
  min-height: 60px;
}
```

- [ ] **Step 4: Commit**

```bash
git add pages/admin/games/\[slug\].vue components/admin/ assets/css/main.css
git commit -m "feat(admin): add game editor with multi-language tabs"
```

---

### Task 6: R2 Cover Upload

**Files:**
- Create: `server/api/admin/upload/cover.post.ts`

- [ ] **Step 1: Create cover upload endpoint**

```ts
// server/api/admin/upload/cover.post.ts
import { requireAdmin } from '../../../utils/admin'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const { slug } = getQuery(event)
  if (!slug) throw createError({ statusCode: 400, statusMessage: 'Missing slug' })

  const body = await readBody(event)
  // body is FormData with file
  const formData = await readFormData(event)
  const file = formData.get('file') as File
  if (!file) throw createError({ statusCode: 400, statusMessage: 'No file uploaded' })

  const buffer = await file.arrayBuffer()
  const ext = file.name.split('.').pop() || 'webp'
  const key = `covers/${slug}.${ext}`

  // Upload to R2
  const r2 = (process.env as any).RETROVAULT_R2
  if (!r2) throw createError({ statusCode: 500, statusMessage: 'R2 not configured' })

  await r2.put(key, buffer, {
    httpMetadata: { contentType: file.type || `image/${ext}` },
  })

  // Update game record
  const db = useD1()
  const coverUrl = `/${key}`
  await db.prepare('UPDATE games SET coverUrl = ?, updatedAt = ? WHERE slug = ?')
    .bind(coverUrl, new Date().toISOString(), slug)
    .run()

  return { success: true, coverUrl }
})
```

- [ ] **Step 2: Commit**

```bash
git add server/api/admin/upload/
git commit -m "feat(admin): add R2 cover upload endpoint"
```

---

### Task 7: Admin Nav Update + Polish

**Modifies:**
- `pages/admin.vue`
- `pages/admin/games/[slug].vue`

- [ ] **Step 1: Add "need translation" indicators to games list**

In `pages/admin/games.vue`, the "Languages" column already shows which languages have content. Enhance the editor to show per-language completion status:

```vue
<!-- In the game list table, after languages column -->
<td style="padding:12px 16px">
  <div style="display:flex;gap:4px">
    <span v-for="lang in ['en','zh','ja']" :key="lang"
      :class="hasLangContent(g, lang) ? 'badge-green' : 'badge-pink'"
      style="font-size:0.6rem;padding:2px 6px">
      {{ lang }}
    </span>
  </div>
</td>
```

- [ ] **Step 2: Commit**

```bash
git add pages/admin/games.vue
git commit -m "feat(admin): add language completion indicators"
```

---

## Summary of Files Created/Modified

| File | Type | Purpose |
|------|------|---------|
| `server/utils/d1.ts` | Create | D1 connection + query helpers |
| `scripts/init-d1.sql` | Create | D1 schema |
| `scripts/import-to-d1.mjs` | Create | Import scraper data to D1 |
| `server/utils/admin.ts` | Create | Admin role check + requireAdmin() |
| `server/api/auth/verify.get.ts` | Modify | Seed initial admin on first login |
| `server/api/admin/games.get.ts` | Create | List games with filters |
| `server/api/admin/games/[slug].get.ts` | Create | Get single game |
| `server/api/admin/games/[slug].put.ts` | Create | Update game |
| `server/api/admin/stats.get.ts` | Create | Dashboard stats |
| `server/api/admin/upload/cover.post.ts` | Create | R2 cover upload |
| `composables/useAdmin.ts` | Create | Admin composable |
| `middleware/admin-auth.ts` | Create | Admin route guard |
| `pages/admin.vue` | Create | Admin layout |
| `pages/admin/index.vue` | Create | Dashboard |
| `pages/admin/games.vue` | Create | Games list |
| `pages/admin/games/[slug].vue` | Create | Game editor |
| `components/admin/FormField.vue` | Create | Reusable form field |
| `assets/css/main.css` | Modify | Add form-input styles |
