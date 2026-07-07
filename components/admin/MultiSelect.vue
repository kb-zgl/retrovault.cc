<template>
  <div ref="wrapperRef" class="multi-select">
    <!-- Selected chips -->
    <div v-if="selected.length" class="multi-select__chips">
      <span v-for="key in selected" :key="key" class="multi-select__chip">
        {{ labelForKey(key) }}
        <span class="multi-select__chip-remove" @click="remove(key)">&times;</span>
      </span>
    </div>

    <!-- Input -->
    <input
      ref="inputRef"
      v-model="query"
      class="form-input"
      :placeholder="selected.length ? 'Add more...' : placeholder"
      @focus="open"
      @keydown.down.prevent="highlightNext"
      @keydown.up.prevent="highlightPrev"
      @keydown.enter.prevent="selectHighlighted"
      @keydown.escape="close"
      @keydown.backspace="handleBackspace"
    />

    <!-- Dropdown -->
    <div v-if="isOpen" class="multi-select__dropdown">
      <div
        v-for="(opt, i) in filtered"
        :key="opt.key"
        class="multi-select__option"
        :class="{ 'multi-select__option--active': i === highlightIdx }"
        @click="toggle(opt)"
        @mouseenter="highlightIdx = i"
      >
        <span
          class="multi-select__option-check"
          :class="{ 'multi-select__option-check--checked': selected.includes(opt.key) }"
        >
          {{ selected.includes(opt.key) ? '✓' : '' }}
        </span>
        {{ opt.label }}
      </div>
      <div v-if="filtered.length === 0" class="multi-select__empty">
        No matches
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import type { RefEntry } from '~/utils/reference-data'

const props = withDefaults(defineProps<{
  modelValue: string[]
  options: RefEntry[]
  placeholder?: string
}>(), {
  placeholder: 'Select...',
})

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

const wrapperRef = ref<HTMLDivElement | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)
const query = ref('')
const isOpen = ref(false)
const highlightIdx = ref(0)

const selected = computed(() => props.modelValue)

const labelMap = computed(() => {
  const map: Record<string, string> = {}
  for (const opt of props.options) {
    map[opt.key] = opt.label
  }
  return map
})

function labelForKey(key: string): string {
  return labelMap.value[key] || key
}

const filtered = computed(() => {
  if (!query.value) {
    // Show unselected options first
    return [
      ...props.options.filter(o => !selected.value.includes(o.key)),
      ...props.options.filter(o => selected.value.includes(o.key)),
    ]
  }
  const q = query.value.toLowerCase()
  return props.options.filter(o =>
    (o.label.toLowerCase().includes(q) || o.key.toLowerCase().includes(q)),
  )
})

function open() {
  isOpen.value = true
  highlightIdx.value = 0
}

function close() {
  isOpen.value = false
}

function toggle(opt: RefEntry) {
  const idx = selected.value.indexOf(opt.key)
  let next: string[]
  if (idx >= 0) {
    next = [...selected.value]
    next.splice(idx, 1)
  } else {
    next = [...selected.value, opt.key]
  }
  emit('update:modelValue', next)
  query.value = ''
  inputRef.value?.focus()
}

function remove(key: string) {
  const next = selected.value.filter(k => k !== key)
  emit('update:modelValue', next)
}

function highlightNext() {
  if (!isOpen.value) { isOpen.value = true; return }
  highlightIdx.value = Math.min(highlightIdx.value + 1, filtered.value.length - 1)
}

function highlightPrev() {
  if (!isOpen.value) { isOpen.value = true; return }
  highlightIdx.value = Math.max(highlightIdx.value - 1, 0)
}

function selectHighlighted() {
  if (!isOpen.value || filtered.value.length === 0) return
  const opt = filtered.value[highlightIdx.value]
  if (opt) toggle(opt)
}

function handleBackspace() {
  if (!query.value && selected.value.length > 0) {
    const last = selected.value[selected.value.length - 1]
    if (last) remove(last)
  }
}

function onClickOutside(e: MouseEvent) {
  if (wrapperRef.value && !wrapperRef.value.contains(e.target as Node)) {
    close()
  }
}

onMounted(() => {
  document.addEventListener('click', onClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', onClickOutside)
})
</script>
