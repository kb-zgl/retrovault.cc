<template>
  <div>
    <NuxtLink to="/admin/games" style="color:var(--color-text-secondary);font-size:0.8rem;text-decoration:none;display:inline-block;margin-bottom:16px">← Back to Games</NuxtLink>

    <div v-if="pending" class="skeleton" style="height:400px;border-radius:var(--radius-md)" />

    <div v-else-if="error && slug !== '__new__'" style="color:var(--color-accent);padding:20px;text-align:center">Failed to load game: {{ error.message }}</div>

    <template v-else>
      <!-- Header -->
      <div style="display:flex;align-items:center;gap:16px;margin-bottom:24px">
        <div style="position:relative;width:60px;height:60px;flex-shrink:0">
          <img v-if="coverPreview || game.coverUrl" :src="coverPreview || game.coverUrl" alt="" style="width:60px;height:60px;border-radius:var(--radius-sm);object-fit:cover;border:1px solid var(--color-border)">
          <button @click="triggerCoverUpload" class="btn-pixel" style="position:absolute;bottom:-6px;right:-6px;padding:2px 6px;font-size:0.5rem;line-height:1">📷</button>
          <input ref="coverInput" type="file" accept="image/*" style="display:none" @change="uploadCover" />
        </div>
        <div>
          <h1 style="font-size:1.1rem;font-weight:700;color:var(--color-text-primary)">{{ game.title }}</h1>
          <div style="font-size:0.75rem;color:var(--color-text-muted)">{{ game.slug }} · {{ game.platform }} · {{ game.year }}</div>
        </div>
        <div style="margin-left:auto;display:flex;gap:8px">
          <button @click="showJsonImport = !showJsonImport" class="btn-pixel" style="padding:8px 16px;font-size:0.7rem">
            📥 JSON
          </button>
          <button @click="save" :disabled="saving" class="btn-pixel-green" style="padding:8px 20px;font-size:0.75rem">
            {{ saving ? 'Saving...' : 'Save' }}
          </button>
        </div>
      </div>

      <!-- JSON Quick Import -->
      <div v-if="showJsonImport" class="card" style="padding:16px;margin-bottom:20px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <h3 style="font-size:0.8rem;font-weight:600;color:var(--color-text-primary)">Quick Import JSON</h3>
          <button @click="parseJsonImport" class="btn-pixel-green" style="padding:4px 12px;font-size:0.65rem">Parse & Fill</button>
        </div>
        <textarea v-model="jsonImportText" class="form-input" rows="8" placeholder='Paste game JSON here...&#10;&#10;{\n  "title": "...",\n  "platform": "NES",\n  ...}'></textarea>
        <div v-if="jsonError" style="color:var(--color-accent);font-size:0.7rem;margin-top:4px">{{ jsonError }}</div>
        <div style="font-size:0.65rem;color:var(--color-text-muted);margin-top:4px">JSON 字段会自动映射到表单，确认后手动保存</div>
      </div>

      <div v-if="saveSuccess" class="badge-green" style="margin-bottom:16px;padding:8px 16px">Saved successfully</div>
      <div v-if="saveError" class="badge-pink" style="margin-bottom:16px;padding:8px 16px">Save failed: {{ saveError }}</div>

      <!-- ════════════════════════════════════════════════
           PART 1: Public Fields (language-independent)
           ════════════════════════════════════════════════ -->
      <div class="card" style="padding:24px;margin-bottom:24px">
        <h3 style="font-size:0.85rem;font-weight:600;color:var(--color-text-primary);margin-bottom:16px">General Info</h3>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px">
          <FormField label="Title (EN)" required>
            <input v-model="form.title" class="form-input" />
          </FormField>
          <FormField label="Platform" required>
            <input v-model="form.platform" class="form-input" />
          </FormField>
          <FormField label="Year">
            <input v-model.number="form.year" type="number" class="form-input" />
          </FormField>
          <FormField label="Genre">
            <input v-model="form.genre" class="form-input" />
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
          <FormField label="Language">
            <input v-model="form.language" class="form-input" placeholder="English" />
          </FormField>
          <FormField label="Source">
            <input v-model="form.source" class="form-input" placeholder="scraped / manual" />
          </FormField>
          <FormField label="Is Hack">
            <select v-model="form.isHack" class="form-input">
              <option :value="0">No</option>
              <option :value="1">Yes</option>
            </select>
          </FormField>
          <FormField label="Status">
            <select v-model="form.status" class="form-input">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </FormField>
        </div>

        <h3 style="font-size:0.85rem;font-weight:600;color:var(--color-text-primary);margin:20px 0 12px">Emulator & Files</h3>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px">
          <FormField label="ROM Path">
            <input v-model="form.defaultRom" class="form-input" placeholder="roms/nes/xxx.nes" />
          </FormField>
          <FormField label="EJS Core">
            <input v-model="form.ejsCore" class="form-input" placeholder="nes / snes / gba" />
          </FormField>
          <FormField label="BIOS URL">
            <input v-model="form.ejsBiosUrl" class="form-input" />
          </FormField>
          <FormField label="Cover URL">
            <input v-model="form.coverUrl" class="form-input" />
          </FormField>
          <FormField label="Original Image URL">
            <input v-model="form.imageUrl" class="form-input" />
          </FormField>
        </div>

        <!-- English Description -->
        <h3 style="font-size:0.85rem;font-weight:600;color:var(--color-text-primary);margin:20px 0 12px">English Description</h3>
        <textarea v-model="form.description" class="form-input" rows="3" placeholder="Short description in English"></textarea>

        <!-- Tags -->
        <h3 style="font-size:0.85rem;font-weight:600;color:var(--color-text-primary);margin:20px 0 12px">Tags</h3>
        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px">
          <span v-for="(tag, i) in form.tags" :key="i" class="badge-pink" style="font-size:0.65rem;padding:4px 10px;cursor:pointer" @click="form.tags.splice(i, 1)">{{ tag }} ✕</span>
        </div>
        <div style="display:flex;gap:8px">
          <input v-model="newTag" @keydown.enter.prevent="addTag" placeholder="Type tag and Enter" class="form-input" style="flex:1" />
          <button @click="addTag" class="btn-pixel" style="padding:4px 16px;font-size:0.7rem">Add</button>
        </div>
      </div>

      <!-- ════════════════════════════════════════════════
           PART 2: Language Content (one tab per language)
           ════════════════════════════════════════════════ -->
      <div class="card" style="padding:24px">
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

        <section>
          <h3 style="font-size:0.85rem;font-weight:600;color:var(--color-text-primary);margin-bottom:12px">{{ langLabels[activeLang] }} Content</h3>
          <FormField :label="'Title (' + activeLang.toUpperCase() + ')'">
            <input v-model="localeForm.title" class="form-input" :placeholder="activeLang === 'en' ? form.title : ''" />
          </FormField>
          <FormField label="Short Description">
            <textarea v-model="localeForm.description" class="form-input" rows="3" :placeholder="activeLang === 'en' ? form.description : ''"></textarea>
          </FormField>
          <FormField label="Long Description">
            <div v-for="(para, i) in localeForm.longDesc" :key="i" style="display:flex;gap:8px;margin-bottom:8px">
              <textarea v-model="localeForm.longDesc[i]" class="form-input" rows="2" style="flex:1"></textarea>
              <button @click="localeForm.longDesc.splice(i, 1)" style="color:var(--color-accent);background:none;border:none;cursor:pointer;font-size:1rem">✕</button>
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
definePageMeta({
  layout: 'admin',
  middleware: ['admin-auth']
})

const route = useRoute()
const { adminFetch } = useAdmin()
const slug = route.params.slug

const availableLangs = ['en', 'zh', 'ja']
const langLabels = { en: 'English', zh: '中文', ja: '日本語' }
const activeLang = ref('zh')

const saving = ref(false)
const saveSuccess = ref(false)
const saveError = ref('')
const newTag = ref('')
const showJsonImport = ref(false)
const jsonImportText = ref('')
const jsonError = ref('')

// PART 1: Public fields (not language-specific)
const form = reactive({
  title: '', platform: '', year: null, genre: '', developer: '', publisher: '', series: '',
  isHack: 0, language: '', tags: [],
  defaultRom: '', ejsCore: '', ejsBiosUrl: '',
  coverUrl: '', imageUrl: '',
  description: '', source: '', status: 'draft',
  langs: {},
})

// PART 2: Active language content
const localeForm = reactive({
  title: '', description: '', longDesc: [], controls: { 'D-Pad': '', 'A': '', 'B': '', 'Start': '' }
})

// Load game data
const { data: game, pending, error } = useAsyncData(`admin-game-${slug}`, () =>
  adminFetch(`/api/admin/games/${slug}`),
  { server: false, lazy: true }
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
  form.isHack = g.isHack ? 1 : 0
  form.language = g.language || ''
  form.tags = Array.isArray(g.tags) ? g.tags : []
  form.defaultRom = g.defaultRom || ''
  form.ejsCore = g.ejsCore || ''
  form.ejsBiosUrl = g.ejsBiosUrl || ''
  form.coverUrl = g.coverUrl || ''
  form.imageUrl = g.imageUrl || ''
  form.description = g.description || ''
  form.source = g.source || ''
  form.status = g.status || 'draft'
  form.langs = (g.langs && typeof g.langs === 'object') ? g.langs : {}
  syncLocaleForm()
}, { immediate: true })

watch(activeLang, () => syncLocaleForm())

function syncLocaleForm() {
  const l = form.langs[activeLang.value] || {}
  localeForm.title = l.title || ''
  localeForm.description = l.description || ''
  localeForm.longDesc = Array.isArray(l.longDesc) ? l.longDesc : []
  localeForm.controls = (l.controls && typeof l.controls === 'object') ? l.controls : { 'D-Pad': '', 'A': '', 'B': '', 'Start': '' }
}

function addTag() {
  const t = newTag.value.trim()
  if (t && !form.tags.includes(t)) form.tags.push(t)
  newTag.value = ''
}

function parseJsonImport() {
  jsonError.value = ''
  try {
    const data = JSON.parse(jsonImportText.value)

    // Map JSON fields to form
    const fieldMap = {
      title: 'title', platform: 'platform', year: 'year',
      genre: 'genre', developer: 'developer', publisher: 'publisher',
      series: 'series', language: 'language',
      defaultRom: 'defaultRom', ejsCore: 'ejsCore', ejsBiosUrl: 'ejsBiosUrl',
      coverUrl: 'coverUrl', imageUrl: 'imageUrl',
      description: 'description', source: 'source',
      isHack: 'isHack', status: 'status',
      tags: 'tags', langs: 'langs',
    }

    for (const [jsonKey, formKey] of Object.entries(fieldMap)) {
      if (data[jsonKey] !== undefined) {
        form[formKey] = data[jsonKey]
      }
    }

    // Handle ejs object: ejs.core → ejsCore, ejs.biosUrl → ejsBiosUrl
    if (data.ejs) {
      if (data.ejs.core) form.ejsCore = data.ejs.core
      if (data.ejs.biosUrl) form.ejsBiosUrl = data.ejs.biosUrl
    }

    // Sync locale form with active language
    syncLocaleForm()

    showJsonImport.value = false
    jsonImportText.value = ''
  } catch (e) {
    jsonError.value = 'Invalid JSON: ' + (e.message || 'parse error')
  }
}

const coverInput = ref(null)
const coverPreview = ref('')

function triggerCoverUpload() {
  coverInput.value?.click()
}

async function uploadCover(event) {
  const file = event.target?.files?.[0]
  if (!file) return
  try {
    const formData = new FormData()
    formData.append('file', file)
    const token = localStorage.getItem('app-token')
    const res = await $fetch(`/api/admin/upload/cover?slug=${slug}`, {
      method: 'POST', body: formData,
      headers: { authorization: token ? `Bearer ${token}` : '' },
    })
    coverPreview.value = res.coverUrl
    saveSuccess.value = true
    setTimeout(() => { saveSuccess.value = false }, 3000)
  } catch (e) {
    saveError.value = 'Cover upload failed: ' + ((e && e.message) || 'Unknown error')
  }
}

async function save() {
  saving.value = true
  saveSuccess.value = false
  saveError.value = ''

  // Sync current locale back to langs
  form.langs[activeLang.value] = {
    title: localeForm.title || undefined,
    description: localeForm.description || undefined,
    longDesc: localeForm.longDesc.filter(p => p.trim()) || undefined,
    controls: localeForm.controls || undefined,
  }

  try {
    await adminFetch(`/api/admin/games/${slug}`, {
      method: 'PUT',
      body: {
        title: form.title, platform: form.platform, year: form.year,
        genre: form.genre, developer: form.developer, publisher: form.publisher,
        series: form.series, isHack: form.isHack, language: form.language,
        tags: form.tags, langs: form.langs,
        defaultRom: form.defaultRom, ejsCore: form.ejsCore, ejsBiosUrl: form.ejsBiosUrl,
        coverUrl: form.coverUrl, imageUrl: form.imageUrl,
        description: form.description, source: form.source, status: form.status,
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
</script>
