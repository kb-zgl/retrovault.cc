<template>
  <div
    style="
      display: flex;
      width: 100%;
      height: 100%;
      background: #0d0b12;
      font-family: Inter, sans-serif;
      padding: 64px 72px;
    "
  >
    <!-- Left: main content -->
    <div style="display: flex; flex-direction: column; flex: 1; justify-content: center;">
      <!-- Decorative pink bar -->
      <div style="display: flex; gap: 8px; margin-bottom: 24px;">
        <div style="width: 40px; height: 6px; background: #e02d7a; border-radius: 3px;" />
        <div style="width: 16px; height: 6px; background: #e02d7a; border-radius: 3px; opacity: 0.4;" />
      </div>

      <!-- Type badge -->
      <div
        style="
          display: flex;
          align-items: center;
          margin-bottom: 16px;
          padding: 6px 14px;
          background: rgba(224, 45, 122, 0.12);
          border-radius: 20px;
          width: fit-content;
        "
      >
        <div style="width: 8px; height: 8px; background: #e02d7a; border-radius: 50%; margin-right: 8px;" />
        <span style="font-size: 14px; color: #e02d7a; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase;">
          {{ type || 'Page' }}
        </span>
      </div>

      <!-- Title -->
      <h1
        style="
          font-size: 52px;
          font-weight: 700;
          color: #f0f0f0;
          line-height: 1.15;
          letter-spacing: -0.5px;
          margin: 0 0 16px 0;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
          max-width: 640px;
        "
      >
        {{ title || 'RetroVault' }}
      </h1>

      <!-- Description -->
      <p
        v-if="description"
        style="
          font-size: 18px;
          color: #9e97ad;
          line-height: 1.5;
          margin: 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          max-width: 540px;
        "
      >
        {{ description }}
      </p>
    </div>

    <!-- Right: brand panel -->
    <div
      style="
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        align-items: flex-end;
        width: 200px;
        flex-shrink: 0;
        margin-left: 48px;
      "
    >
      <!-- Site name -->
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
        <div style="width: 10px; height: 10px; background: #e02d7a; border-radius: 2px;" />
        <span style="font-size: 22px; color: #f0f0f0; font-weight: 700; letter-spacing: -0.3px;">RetroVault</span>
      </div>

      <!-- Bottom accent line -->
      <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 6px;">
        <div style="width: 80px; height: 3px; background: #e02d7a; border-radius: 2px;" />
        <div style="width: 40px; height: 3px; background: #e02d7a; border-radius: 2px; opacity: 0.4;" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title?: string
  description?: string
  type?: string
}>()
</script>
