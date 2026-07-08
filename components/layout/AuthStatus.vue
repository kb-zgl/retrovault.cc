<template>
  <div ref="wrapperRef" class="auth-status" :class="{ 'auth-status--logged-in': isLoggedIn }">
    <!-- 未登录 -->
    <button v-if="!isLoggedIn" class="auth-btn" @click="login">
      👤 {{ t('footer.login') }}
    </button>

    <!-- 已登录 -->
    <button v-else class="auth-btn auth-btn--user" @click="dropdownOpen = !dropdownOpen">
      <span class="auth-avatar">{{ userAvatar }}</span>
      <span class="auth-username">{{ user?.username }}</span>
      <svg class="auth-chevron" :class="{ open: dropdownOpen }" width="10" height="10" viewBox="0 0 10 10">
        <path d="M2 3.5l3 3 3-3" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
      </svg>
    </button>

    <!-- 下拉菜单 -->
    <div v-if="dropdownOpen" class="auth-dropdown">
      <div class="auth-dropdown-header">
        <span class="auth-dropdown-avatar">{{ userAvatar }}</span>
        <div>
          <div class="auth-dropdown-name">{{ user?.username }}</div>
          <div class="auth-dropdown-email">{{ user?.email }}</div>
        </div>
      </div>
      <div class="auth-dropdown-divider" />
      <button class="auth-dropdown-item auth-dropdown-item--danger" @click="handleLogout">
        🚪 {{ t('auth.logout') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t } = useAppI18n()
const { isLoggedIn, user, login, logout } = useAuth()

const dropdownOpen = ref(false)
const wrapperRef = ref<HTMLDivElement | null>(null)

const userAvatar = computed(() => {
  if (user.value?.avatarUrl) return ''
  const name = user.value?.username || '?'
  return name.charAt(0).toUpperCase()
})

function handleLogout() {
  dropdownOpen.value = false
  logout()
}

function onClickOutside(e: MouseEvent) {
  if (wrapperRef.value && !wrapperRef.value.contains(e.target as Node)) {
    dropdownOpen.value = false
  }
}

onMounted(() => document.addEventListener('click', onClickOutside))
onUnmounted(() => document.removeEventListener('click', onClickOutside))
</script>
