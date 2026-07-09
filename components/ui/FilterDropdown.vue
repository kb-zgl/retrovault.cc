<template>
  <div class="fd-root" ref="rootRef">
    <button
      class="fd-btn"
      :class="{ 'fd-has-value': !!modelValue }"
      @click="toggleOpen"
      :aria-expanded="open"
    >
      <span class="fd-label">{{ label }}</span>
      <span class="fd-value">{{ displayValue }}</span>
      <span class="fd-arrow" :class="{ up: open }">▾</span>
    </button>

    <!-- Desktop: absolute dropdown -->
    <div v-if="open && !isMobile" class="fd-panel" @click.stop>
      <button
        class="fd-opt"
        :class="{ active: !modelValue }"
        @click="select(null)"
      >{{ placeholderText }}</button>
      <button
        v-for="opt in options"
        :key="getValue(opt)"
        class="fd-opt"
        :class="{ active: modelValue === getValue(opt) }"
        @click="select(getValue(opt))"
      >{{ getLabel(opt) }}</button>
    </div>

    <!-- Mobile: bottom sheet -->
    <Teleport to="body">
      <div v-if="open && isMobile" class="fd-mob-overlay" @click.self="close">
        <div class="fd-mob-sheet">
          <div class="fd-mob-head">
            <span class="fd-mob-title">{{ label }}</span>
            <button class="fd-mob-close" @click="close" aria-label="Close">✕</button>
          </div>
          <div class="fd-mob-list">
            <button
              class="fd-opt"
              :class="{ active: !modelValue }"
              @click="select(null)"
            >{{ placeholderText }}</button>
            <button
              v-for="opt in options"
              :key="getValue(opt)"
              class="fd-opt"
              :class="{ active: modelValue === getValue(opt) }"
              @click="select(getValue(opt))"
            >{{ getLabel(opt) }}</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  label: string
  options: (string | { label: string; value: string })[]
  modelValue: string
  placeholder?: string
}>(), {
  placeholder: '',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const rootRef = ref<HTMLElement | null>(null)
const open = ref(false)
const isMobile = ref(false)

const placeholderText = computed(() => props.placeholder || '全部')

function getValue(opt: string | { label: string; value: string }): string {
  return typeof opt === 'string' ? opt : opt.value
}

function getLabel(opt: string | { label: string; value: string }): string {
  return typeof opt === 'string' ? opt : opt.label
}

const displayValue = computed(() => {
  if (!props.modelValue) return ''
  const found = props.options.find(o => getValue(o) === props.modelValue)
  return found ? getLabel(found) : props.modelValue
})

function select(val: string | null) {
  emit('update:modelValue', val || '')
  close()
}

function toggleOpen() {
  open.value = !open.value
}

function close() {
  open.value = false
}

function onClickOutside(e: MouseEvent) {
  if (!open.value) return
  if (rootRef.value && !rootRef.value.contains(e.target as Node)) {
    close()
  }
}

function checkMobile() {
  isMobile.value = window.innerWidth < 768
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
  document.addEventListener('click', onClickOutside)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
  document.removeEventListener('click', onClickOutside)
})
</script>
