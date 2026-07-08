<template>
  <div>
    <NuxtLink to="/admin/games" style="color:var(--color-text-secondary);font-size:0.8rem;text-decoration:none;display:inline-block;margin-bottom:16px">← 返回游戏列表</NuxtLink>

    <div v-if="pending" class="skeleton" style="height:400px;border-radius:var(--radius-md)" />

    <div v-else-if="error && rawSlug !== '__new__'" style="color:var(--color-accent);padding:20px;text-align:center">游戏加载失败：{{ error.message }}</div>

    <template v-else>
      <!-- Header -->
      <div style="display:flex;align-items:center;gap:16px;margin-bottom:24px">
        <div style="position:relative;width:187px;height:259px;flex-shrink:0;border-radius:var(--radius-md);border:2px dashed var(--color-border);overflow:hidden;cursor:pointer;background:var(--color-bg-elevated)" @click="triggerCoverUpload">
          <img v-if="coverPreview || form.coverUrl" :src="coverPreview || form.coverUrl" alt="" style="width:100%;height:100%;object-fit:cover">
          <div v-else style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;font-size:0.65rem;color:var(--color-text-muted);gap:4px">
            <span style="font-size:1.5rem">🎮</span>
            <span>点击上传封面</span>
          </div>
          <input ref="coverInput" type="file" accept="image/*" style="display:none" @change="uploadCover" />
        </div>
        <div>
          <h1 style="font-size:1.1rem;font-weight:700;color:var(--color-text-primary)">{{ localeForm.title || form.slug || '新建游戏' }}</h1>
          <div v-if="form.slug" style="font-size:0.75rem;color:var(--color-text-muted)">{{ form.slug }} · {{ form.platform }} · {{ form.year }}</div>
        </div>
        <div style="margin-left:auto;display:flex;gap:8px">
          <button @click="showJsonImport = !showJsonImport" class="btn-pixel" style="padding:8px 16px;font-size:0.7rem">
            📥 JSON
          </button>
          <button @click="save" :disabled="saving" class="btn-pixel-green" style="padding:8px 20px;font-size:0.75rem">
            {{ saving ? '保存中...' : '保存' }}
          </button>
        </div>
      </div>

      <!-- JSON Quick Import -->
      <div v-if="showJsonImport" class="card-static" style="padding:16px;margin-bottom:20px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <h3 style="font-size:0.8rem;font-weight:600;color:var(--color-text-primary)">快速导入 JSON</h3>
          <button @click="parseJsonImport" class="btn-pixel-green" style="padding:4px 12px;font-size:0.65rem">解析并填充</button>
        </div>
        <textarea v-model="jsonImportText" class="form-input" rows="8" placeholder='在此粘贴游戏 JSON...&#10;&#10;{\n  "title": "...",\n  "platform": "NES",\n  ...}'></textarea>
        <div v-if="jsonError" style="color:var(--color-accent);font-size:0.7rem;margin-top:4px">{{ jsonError }}</div>
        <div style="font-size:0.65rem;color:var(--color-text-muted);margin-top:4px">JSON 字段会自动映射到表单，确认后手动保存</div>
      </div>

      <div v-if="saveSuccess" class="badge-green" style="margin-bottom:16px;padding:8px 16px">保存成功</div>
      <div v-if="saveError" class="badge-pink" style="margin-bottom:16px;padding:8px 16px">保存失败：{{ saveError }}</div>

      <!-- ════════════════════════════════════════════════
           PART 1: Public Fields (language-independent)
           ════════════════════════════════════════════════ -->
      <div class="card-static" style="padding:24px;margin-bottom:24px;overflow:visible">
        <h3 style="font-size:0.85rem;font-weight:600;color:var(--color-text-primary);margin-bottom:16px">基本信息</h3>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px">
          <FormField label="标识" :required="isNew">
            <input v-model="form.slug" class="form-input" :readonly="!isNew" :style="!isNew ? 'opacity:0.6' : ''" placeholder="my-game-slug" />
          </FormField>
          <FormField label="平台" required>
            <SearchableSelect v-model="form.platform" :options="refData.platforms" placeholder="选择平台..." />
          </FormField>
          <FormField label="年份">
            <select v-model.number="form.year" class="form-input">
              <option value="">—</option>
              <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}</option>
            </select>
          </FormField>
          <FormField label="类型">
            <SearchableSelect v-model="form.genre" :options="refData.genres" placeholder="选择类型..." />
          </FormField>
          <FormField label="开发商">
            <SearchableSelect v-model="form.developer" :options="refData.developers" placeholder="选择开发商..." />
          </FormField>
          <FormField label="发行商">
            <SearchableSelect v-model="form.publisher" :options="refData.publishers" placeholder="选择发行商..." />
          </FormField>
          <FormField label="系列">
            <SearchableSelect v-model="form.series" :options="refData.series" placeholder="选择系列..." />
          </FormField>
          <FormField label="语言">
            <input v-model="form.language" class="form-input" placeholder="英语" />
          </FormField>
          <FormField label="来源">
            <input v-model="form.source" class="form-input" placeholder="抓取 / 手动" />
          </FormField>
          <FormField label="是否改版">
            <select v-model="form.isHack" class="form-input">
              <option :value="0">否</option>
              <option :value="1">是</option>
            </select>
          </FormField>
          <FormField label="状态">
            <select v-model="form.status" class="form-input">
              <option value="draft">草稿</option>
              <option value="published">已发布</option>
            </select>
          </FormField>
        </div>

        <h3 style="font-size:0.85rem;font-weight:600;color:var(--color-text-primary);margin:20px 0 12px">模拟器与文件</h3>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px">
          <FormField label="ROM 路径">
            <input v-model="form.defaultRom" class="form-input" placeholder="roms/nes/xxx.nes" />
          </FormField>
          <FormField label="模拟器核心">
            <input v-model="form.ejsCore" class="form-input" placeholder="nes / snes / gba" />
          </FormField>
          <FormField label="BIOS">
            <select v-model="form.ejsBiosUrl" class="form-input">
              <option value="">无</option>
              <option v-for="b in biosOptions" :key="b.value" :value="b.value">{{ b.label }}</option>
            </select>
          </FormField>
          <FormField label="封面地址">
            <input v-model="form.coverUrl" class="form-input" />
          </FormField>
          <FormField label="原图地址">
            <input v-model="form.imageUrl" class="form-input" />
          </FormField>
        </div>

        <!-- Tags -->
        <h3 style="font-size:0.85rem;font-weight:600;color:var(--color-text-primary);margin:20px 0 12px">标签</h3>
        <MultiSelect v-model="form.tags" :options="refData.tags" placeholder="搜索标签..." />
      </div>

      <!-- ════════════════════════════════════════════════
           PART 2: Language Content (one tab per language)
           ════════════════════════════════════════════════ -->
      <div class="card-static" style="padding:24px">
        <div style="display:flex;gap:4px;margin-bottom:20px;border-bottom:1px solid var(--color-border);padding-bottom:8px">
          <button v-for="lang in availableLangs" :key="lang"
            @click="switchLang(lang)"
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
          <h3 style="font-size:0.85rem;font-weight:600;color:var(--color-text-primary);margin-bottom:12px">{{ langLabels[activeLang] }} 内容</h3>
          <FormField label="标题">
            <input v-model="localeForm.title" class="form-input" />
          </FormField>
          <FormField label="简短描述">
            <textarea v-model="localeForm.description" class="form-input" rows="3" :placeholder="activeLang === 'en' ? form.description : ''"></textarea>
          </FormField>
          <FormField label="详细描述（Markdown）">
            <textarea v-model="localeForm.longDesc" class="form-input" rows="8" style="font-family:var(--font-mono);font-size:0.75rem" placeholder="支持 Markdown 语法：

## 标题

**粗体** *斜体*

- 列表项
- 列表项

[链接文字](url)

```code```"></textarea>
            <div style="font-size:0.6rem;color:var(--color-text-muted);margin-top:4px">支持 Markdown：标题、粗体、列表、链接、代码块、图片</div>
          </FormField>
          <FormField label="操作说明">
            <textarea v-model="controlsText" class="form-input" rows="5" placeholder="D-Pad: 方向&#10;A: 跳跃&#10;B: 攻击&#10;Start: 暂停"></textarea>
          </FormField>
        </section>
      </div>
    </template>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'admin',
  middleware: ['admin-auth'],
  pageTransition: false,
})

const route = useRoute()
const router = useRouter()
const { adminFetch } = useAdmin()
const rawSlug = route.params.slug
const isNew = computed(() => rawSlug === '__new__')

const availableLangs = ['en', 'zh', 'ja']
const langLabels = { en: '英语', zh: '中文', ja: '日语' }
const activeLang = ref('zh')

const saving = ref(false)
const saveSuccess = ref(false)
const saveError = ref('')
const showJsonImport = ref(false)
const jsonImportText = ref('')
const jsonError = ref('')

const refData = getReferenceData('zh')

const yearOptions = computed(() => {
  const years = []
  for (let y = new Date().getFullYear(); y >= 1970; y--) years.push(y)
  return years
})

// core → BIOS 映射（同步 GameEmulator.vue 里的 BIOS_MAP）
const BIOS_MAP: Record<string, string> = {
  psx:      '/bios/scph1001.bin',
  pce:      '/bios/syscard3.pce',
  segaCD:   '/bios/bios_CD_U.bin',
  ngp:      '/bios/neogeo.zip',
  segaSaturn: '/bios/saturn_bios.bin',
  coleco:   '/bios/colecovision.rom',
}

const biosOptions = computed(() =>
  Object.entries(BIOS_MAP).map(([core, url]) => ({
    value: url,
    label: `${url.replace('/bios/', '')} (${core})`,
  })),
)

// PART 1: Public fields (not language-specific)
const form = reactive({
  slug: '', platform: '', year: null, genre: '', developer: '', publisher: '', series: '',
  isHack: 0, language: '', tags: [],
  defaultRom: '', ejsCore: '', ejsBiosUrl: '',
  coverUrl: '', imageUrl: '',
  description: '', source: '', status: 'draft',
  langs: {},
})

// PART 2: Active language content
const localeForm = reactive({
  title: '', description: '', longDesc: ''
})
const controlsText = ref('')

// Load game data
const { data: game, pending, error } = useAsyncData(`admin-game-${rawSlug}`, () =>
  adminFetch(`/api/admin/games/${rawSlug}`),
  { server: false, lazy: true }
)

watch(game, (g) => {
  if (!g) return
  form.slug = g.slug || ''
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

function switchLang(lang) {
  // Save current tab edits before switching
  form.langs[activeLang.value] = {
    title: localeForm.title || undefined,
    description: localeForm.description || undefined,
    longDesc: localeForm.longDesc.trim() || undefined,
    controls: textToControls(controlsText.value) || undefined,
  }
  activeLang.value = lang
  syncLocaleForm()
}

function syncLocaleForm() {
  const l = form.langs[activeLang.value] || {}
  localeForm.title = l.title || ''
  localeForm.description = l.description || ''
  localeForm.longDesc = typeof l.longDesc === 'string' ? l.longDesc : Array.isArray(l.longDesc) ? l.longDesc.join('\n\n') : ''
  controlsText.value = controlsToText(l.controls)
}

function controlsToText(controls) {
  if (!controls || typeof controls !== 'object') return ''
  return Object.entries(controls)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n')
}

function textToControls(text) {
  if (!text || !text.trim()) return {}
  const obj = {}
  text.trim().split('\n').forEach(line => {
    const idx = line.indexOf(':')
    if (idx > 0) {
      const key = line.slice(0, idx).trim()
      const val = line.slice(idx + 1).trim()
      if (key && val) obj[key] = val
    }
  })
  return obj
}

// 核心 → BIOS 自动关联：仅当 BIOS 为空或跟随旧核心映射时自动更新，不覆盖用户手动选择
watch(() => form.ejsCore, (core, oldCore) => {
  if (core && BIOS_MAP[core]) {
    const oldDefault = oldCore ? BIOS_MAP[oldCore] : undefined
    if (
      !form.ejsBiosUrl ||
      (oldDefault && form.ejsBiosUrl === oldDefault)
    ) {
      form.ejsBiosUrl = BIOS_MAP[core]
    }
  }
})

function parseJsonImport() {
  jsonError.value = ''
  try {
    const data = JSON.parse(jsonImportText.value)

    // Map JSON fields to form
    const fieldMap = {
      slug: 'slug', platform: 'platform', year: 'year',
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
    jsonError.value = 'JSON 格式错误：' + (e.message || '解析失败')
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
    const res = await $fetch(`/api/admin/upload/cover?slug=${rawSlug}`, {
      method: 'POST', body: formData,
      headers: { authorization: token ? `Bearer ${token}` : '' },
    })
    coverPreview.value = res.coverUrl
    saveSuccess.value = true
    setTimeout(() => { saveSuccess.value = false }, 3000)
  } catch (e) {
    saveError.value = '封面上传失败：' + ((e && e.message) || '未知错误')
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
    longDesc: localeForm.longDesc.trim() || undefined,
    controls: textToControls(controlsText.value) || undefined,
  }

  try {
    const body = {
      slug: form.slug, platform: form.platform, year: form.year,
      genre: form.genre, developer: form.developer, publisher: form.publisher,
      series: form.series, isHack: form.isHack, language: form.language,
      tags: form.tags, langs: form.langs,
      defaultRom: form.defaultRom, ejsCore: form.ejsCore, ejsBiosUrl: form.ejsBiosUrl,
      coverUrl: form.coverUrl, imageUrl: form.imageUrl,
      description: form.description, source: form.source, status: form.status,
    }
    await adminFetch(`/api/admin/games/${rawSlug}`, { method: 'PUT', body })
    saveSuccess.value = true
    // Redirect to proper slug after creating a new game
    if (isNew.value && form.slug) {
      router.replace(`/admin/games/${form.slug}`)
    }
    setTimeout(() => { saveSuccess.value = false }, 3000)
  } catch (e) {
    saveError.value = e.message || '保存失败'
  } finally {
    saving.value = false
  }
}
</script>
