<template>
  <div
    style="
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      background: #0d0b12;
      font-family: Inter, sans-serif;
      padding: 48px 64px;
    "
  >
    <!-- Top: RetroVault brand -->
    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 32px;">
      <div style="width: 12px; height: 12px; background: #e02d7a; border-radius: 3px;" />
      <span style="font-size: 20px; color: #ede8f5; font-weight: 700; letter-spacing: -0.3px;">RetroVault</span>
      <div style="flex: 1;" />
      <span style="font-size: 13px; color: #9e97ad; font-weight: 400;">2000+ Free Retro Games</span>
    </div>

    <!-- Pink divider -->
    <div style="width: 60px; height: 4px; background: #e02d7a; border-radius: 2px; margin-bottom: 36px;" />

    <!-- Main content: cover + text -->
    <div style="display: flex; flex: 1; align-items: center; gap: 40px;">
      <!-- Cover thumbnail -->
      <div
        v-if="cover"
        style="
          width: 140px;
          height: 140px;
          border-radius: 12px;
          overflow: hidden;
          flex-shrink: 0;
          border: 2px solid rgba(224, 45, 122, 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          background: #1a1722;
        "
      >
        <img
          :src="cover"
          alt=""
          style="width: 100%; height: 100%; object-fit: cover;"
        />
      </div>

      <!-- Text block -->
      <div style="display: flex; flex-direction: column; flex: 1; justify-content: center;">
        <!-- Platform + Genre pill -->
        <div
          v-if="platform || genre"
          style="
            display: flex;
            align-items: center;
            gap: 0;
            margin-bottom: 12px;
          "
        >
          <span
            v-if="platform"
            style="
              font-size: 13px;
              color: #e02d7a;
              font-weight: 600;
              letter-spacing: 0.06em;
              text-transform: uppercase;
              padding: 4px 10px;
              background: rgba(224, 45, 122, 0.1);
              border-radius: 6px;
            "
          >
            {{ platform }}
          </span>
          <span v-if="platform && genre" style="width: 8px;" />
          <span
            v-if="genre"
            style="
              font-size: 13px;
              color: #9e97ad;
              font-weight: 400;
            "
          >
            {{ genre }}
          </span>
        </div>

        <!-- Game title (large) -->
        <h1
          style="
            font-size: 56px;
            font-weight: 700;
            color: #f0f0f0;
            line-height: 1.1;
            letter-spacing: -0.5px;
            margin: 0 0 8px 0;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            max-width: 640px;
          "
        >
          {{ title || 'Retro Game' }}
        </h1>

        <!-- Tagline -->
        <span style="font-size: 16px; color: #9e97ad; font-weight: 400;">
          🕹️ Play Online Free
        </span>
      </div>
    </div>

    <!-- Bottom: cover description -->
    <p
      v-if="description"
      style="
        font-size: 14px;
        color: #6b647a;
        line-height: 1.4;
        margin: 20px 0 0 0;
        display: -webkit-box;
        -webkit-line-clamp: 1;
        -webkit-box-orient: vertical;
        overflow: hidden;
        max-width: 720px;
      "
    >
      {{ description }}
    </p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title?: string
  description?: string
  cover?: string
  platform?: string
  genre?: string
}>()
</script>
