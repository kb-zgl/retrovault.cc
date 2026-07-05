<template>
  <div>
    <div class="section-title">
      {{ t('about.title') }}
      <span class="badge purple">{{ t('about.subtitle') }}</span>
    </div>

    <div class="about-content">
      <p>{{ t('about.para1') }}</p>

      <p>{{ t('about.para2') }}</p>

      <div class="team">
        <div
          v-for="member in team"
          :key="member.name"
          class="team-member"
        >
          <span class="avatar">{{ member.avatar }}</span>
          <div class="name">{{ member.name }}</div>
          <div class="role">{{ member.role }}</div>
        </div>
      </div>

      <p style="margin-top:14px;font-family:var(--font-body);font-size:clamp(0.65rem,1.5vw,0.75rem);color:var(--color-text-muted);letter-spacing:0;">
        📧 retro@vault.cc
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
interface TeamMember {
  avatar: string
  name: string
  role: string
}

const { t } = useAppI18n()

const team = computed<TeamMember[]>(() => [
  { avatar: '👨‍💻', name: 'PixelDriver', role: t('about.roleFounder') },
  { avatar: '🎨', name: 'PixelArtist', role: t('about.roleArtDirector') },
  { avatar: '🕹️', name: 'ArcadeManiac', role: t('about.roleDesigner') },
  { avatar: '📝', name: 'RetroWriter', role: t('about.roleEditor') },
])

useSeoMeta({
  title: t('seo.aboutTitle'),
  description: t('seo.aboutDesc'),
  ogTitle: t('seo.aboutTitle'),
  ogDescription: t('seo.aboutDesc'),
  ogType: 'website',
})
</script>
