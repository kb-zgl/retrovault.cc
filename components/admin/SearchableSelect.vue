<template>
  <div ref="wrapperRef" class="searchable-select">
    <input
      ref="inputRef"
      v-model="query"
      class="form-input"
      :placeholder="placeholder"
      :disabled="disabled"
      @focus="open"
      @keydown.down.prevent="highlightNext"
      @keydown.up.prevent="highlightPrev"
      @keydown.enter.prevent="selectHighlighted"
      @keydown.escape="close"
    />
    <div v-if="isOpen" class="searchable-select__dropdown">
      <div
        v-for="(opt, i) in filtered"
        :key="opt.key"
        class="searchable-select__option"
        :class="{
          'searchable-select__option--active': i === highlightIdx,
          'searchable-select__option--selected': opt.key === selectedKey,
        }"
        @click="select(opt)"
        @mouseenter="highlightIdx = i"
      >
        {{ opt.label }}
      </div>
      <div v-if="filtered.length === 0" class="searchable-select__empty">
        No matches
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import type { RefEntry } from '~/utils/reference-data'

const props = withDefaults(defineProps<{
  modelValue: string
  options: RefEntry[]
  placeholder?: string
  disabled?: boolean
}>(), {
  placeholder: 'Select...',
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const wrapperRef = ref<HTMLDivElement | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)
const query = ref('')
const isOpen = ref(false)
const highlightIdx = ref(0)

const selectedKey = computed(() => props.modelValue)

const filtered = computed(() => {
  if (!query.value) return props.options
  const q = query.value.toLowerCase()
  return props.options.filter(o =>
    o.label.toLowerCase().includes(q) || o.key.toLowerCase().includes(q),
  )
})

function open() {
  isOpen.value = true
  highlightIdx.value = 0
  // Show current value as query
  const selected = props.options.find(o => o.key === props.modelValue)
  if (selected && !query.value) {
    query.value = selected.label
  }
}

function close() {
  isOpen.value = false
  // Reset query to show selected label
  const selected = props.options.find(o => o.key === props.modelValue)
  query.value = selected ? selected.label : ''
}

function select(opt: RefEntry) {
  query.value = opt.label
  emit('update:modelValue', opt.key)
  inputRef.value?.blur()
  close()
}

function highlightNext() {
  if (!isOpen.value) { isOpen.value = true; return }
  highlightIdx.value = Math.min(highlightIdx.value + 1, filtered.value.length - 1)
  scrollIntoView()
}

function highlightPrev() {
  if (!isOpen.value) { isOpen.value = true; return }
  highlightIdx.value = Math.max(highlightIdx.value - 1, 0)
  scrollIntoView()
}

function selectHighlighted() {
  if (!isOpen.value || filtered.value.length === 0) return
  const opt = filtered.value[highlightIdx.value]
  if (opt) select(opt)
}

function scrollIntoView() {
  // The browser handles this with scrollIntoView if needed
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

// Sync input with v-model changes from parent
watch(() => props.modelValue, (val) => {
  if (!isOpen.value) {
    const selected = props.options.find(o => o.key === val)
    query.value = selected ? selected.label : val
  }
})
</script>
