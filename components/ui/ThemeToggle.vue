<template>
  <button
    class="theme-toggle"
    :aria-label="`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`"
    :title="`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`"
    @click="toggle"
  >
    <!-- Sun icon (active in dark mode — click to go light) -->
    <svg
      class="icon-sun"
      :class="{ visible: theme === 'dark' }"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <circle cx="12" cy="12" r="5" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
    <!-- Moon icon (active in light mode — click to go dark) -->
    <svg
      class="icon-moon"
      :class="{ visible: theme === 'light' }"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  </button>
</template>

<script setup lang="ts">
const { theme, toggle } = useTheme()
</script>

<style scoped>
.theme-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: border-color 0.2s, color 0.2s, background 0.2s;
  position: relative;
}

.theme-toggle:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
  background: color-mix(in srgb, var(--color-accent) 8%, transparent);
}

.theme-toggle:active {
  transform: scale(0.92);
}

.theme-toggle svg {
  width: 18px;
  height: 18px;
  position: absolute;
  opacity: 0;
  transform: rotate(-90deg) scale(0.6);
  transition: opacity 0.3s, transform 0.3s;
}

.theme-toggle svg.visible {
  opacity: 1;
  transform: rotate(0deg) scale(1);
}
</style>
