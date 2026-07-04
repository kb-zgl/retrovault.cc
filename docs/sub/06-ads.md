# 06 — 广告集成方案

> 广告网络：Adsterra + HilltopAds + PopAds  
> 不使用 AdSense（ROM站通过率低）

---

## 广告位布局

### 桌面端

```
┌─────────────────────────────────────────────────────────┐
│ Header Nav                                              │
├──────┬──────────────────────────────────────────────────┤
│侧边栏│  游戏封面 + 信息区                                │
│      │                                                  │
│      ├──────────────────────────────────────────────────┤
│      │  [广告位 A: 728x90 Banner]  ← 游戏信息下方       │
│      ├──────────────────────────────────────────────────┤
│      │  操作说明 / 游戏介绍                              │
│      ├──────────────────────────────────────────────────┤
│      │  相关游戏                                         │
└──────┴──────────────────────────────────────────────────┘

游玩状态：
┌─────────────────────────────┬───────────────────────────┐
│  EmulatorJS 游戏窗口 (3/4)  │ [广告位 B: 300x250]       │
│                             │  "You Might Like" 区      │
│                             │  相关游戏 (3个)           │
└─────────────────────────────┴───────────────────────────┘

列表页 / 平台页：
  游戏卡片网格中，每24个卡片中插入1个原生广告位
```

### 移动端

```
游戏详情页（未游玩）：
  [广告位 C: 320x50 底部固定条]

游玩状态：
  游戏窗口全屏，广告仅在进入游玩时触发 Popunder
```

---

## 广告位清单

| ID | 类型 | 尺寸 | 位置 | 网络 | 触发时机 |
|----|------|------|------|------|----------|
| AD-A | Banner | 728x90 | 游戏信息区下方（桌面） | Adsterra | 页面加载 |
| AD-B | Banner | 300x250 | 游玩状态右侧栏 | Adsterra | 点击游玩后 |
| AD-C | Banner | 320x50 | 移动端底部固定 | HilltopAds | 页面加载 |
| AD-D | Popunder | - | 全局 | PopAds / PropellerAds | 首次点击游玩 |
| AD-E | 插页 | - | 游戏加载过渡页 | PropellerAds | 游戏加载期间 |
| AD-F | 原生 | 卡片式 | 游戏列表中穿插 | Adsterra Native | 页面加载 |

---

## AdSlot 组件

```vue
<!-- components/AdSlot.vue -->
<template>
  <div
    v-if="shouldShow"
    :class="containerClass"
    :data-ad-slot="slotId"
  >
    <!-- Adsterra Banner -->
    <template v-if="network === 'adsterra'">
      <ins
        class="adsterra-ad"
        :data-key="adKey"
        :style="{ display: 'inline-block', width: `${width}px`, height: `${height}px` }"
      />
    </template>

    <!-- HilltopAds Banner -->
    <template v-else-if="network === 'hilltopads'">
      <div :id="`hilltop-${slotId}`" />
    </template>

    <!-- 占位（开发环境显示） -->
    <template v-else-if="isDev">
      <div
        class="bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-400 text-xs"
        :style="{ width: `${width}px`, height: `${height}px` }"
      >
        AD {{ width }}x{{ height }} [{{ slotId }}]
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  slotId:  string           // AD-A / AD-B 等
  network: 'adsterra' | 'hilltopads' | 'popads' | 'dev'
  adKey?:  string           // 广告网络的key/zone
  width:   number
  height:  number
}>()

const isDev       = process.dev
const shouldShow  = computed(() => !isDev || props.network === 'dev')
const containerClass = computed(() => ({
  'flex justify-center my-4': true,
  'adsense-container': true,
}))
</script>
```

---

## Popunder 集成

Popunder 在用户第一次点击「游玩」按钮时触发，每个会话只触发一次。

```typescript
// composables/usePopunder.ts
export function usePopunder() {
  const triggered = ref(false)

  function trigger() {
    if (triggered.value) return
    if (typeof window === 'undefined') return

    triggered.value = true

    // PopAds
    // window._paq = window._paq || []
    // window._paq.push(['trackEvent', 'Game', 'Play'])

    // PropellerAds
    // (window.adsbygoogle = window.adsbygoogle || []).push({})

    // Adsterra Popunder
    const script    = document.createElement('script')
    script.async    = true
    script.src      = '//YOUR_ADSTERRA_POPUNDER_URL'
    document.body.appendChild(script)
  }

  return { trigger }
}
```

在 `GameEmulator.vue` 的游玩按钮点击时调用：

```typescript
const { trigger: triggerPopunder } = usePopunder()

function handlePlay() {
  triggerPopunder()  // 触发 Popunder
  startGame()        // 加载模拟器
}
```

---

## 游戏加载插页广告

游戏加载期间（EmulatorJS 初始化需要时间）展示插页广告：

```vue
<!-- 游戏加载过渡层 -->
<div v-if="gameLoading" class="game-loading-overlay">
  <div class="loading-content">
    <div class="spinner" />
    <p>{{ $t('gameDetail.loading') }}</p>
  </div>

  <!-- 插页广告区 -->
  <AdSlot slot-id="AD-E" network="propellerads" :width="300" :height="250" />
</div>
```

---

## 广告加载策略

- **懒加载**：广告代码在页面交互后才注入（避免影响 LCP 指标）
- **游玩状态隐藏**：进入全屏游玩时，隐藏所有 Banner 广告
- **移动端适配**：移动端不显示 728x90，改用 320x50
- **广告屏蔽检测**：不做强制反广告屏蔽，避免影响用户体验

```typescript
// plugins/ads.client.ts
export default defineNuxtPlugin(() => {
  // 延迟加载广告脚本，不阻塞首屏
  if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
      setTimeout(() => {
        initAdsterra()
        initHilltopAds()
      }, 1000)
    })
  }
})
```

---

## 广告配置文件

```typescript
// config/ads.ts
export const ADS_CONFIG = {
  enabled: process.env.NODE_ENV === 'production',

  adsterra: {
    banner728x90: {
      key:    process.env.ADSTERRA_KEY_728,
      width:  728,
      height: 90,
    },
    banner300x250: {
      key:    process.env.ADSTERRA_KEY_300,
      width:  300,
      height: 250,
    },
    banner320x50: {
      key:    process.env.ADSTERRA_KEY_320,
      width:  320,
      height: 50,
    },
  },

  popunder: {
    network: 'popads',       // popads / propellerads / adsterra
    scriptUrl: process.env.POPUNDER_SCRIPT_URL,
    sessionOnce: true,       // 每个会话只触发一次
  },
}
```
