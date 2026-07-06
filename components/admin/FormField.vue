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
