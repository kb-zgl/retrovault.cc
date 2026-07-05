<template>
  <select
    class="locale-switcher"
    :value="locale"
    @change="switchLocale(($event.target as HTMLSelectElement).value as 'en' | 'zh')"
    aria-label="Switch language"
  >
    <option value="en">🇬🇧 EN</option>
    <option value="zh">🇨🇳 中文</option>
  </select>
</template>

<script setup lang="ts">
const { locale, setLocale } = useAppI18n()
const route = useRoute()
const router = useRouter()

async function switchLocale(lang: 'en' | 'zh') {
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
