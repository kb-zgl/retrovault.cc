<template>
  <div>
    <div class="section-title">
      ℹ️ About
      <span class="badge purple">Pixel Heart</span>
    </div>

    <div class="about-content">
      <p>
        🎮 <span class="highlight">RETRO VAULT</span> is a retro gaming site built by enthusiasts.
        We collect, curate, and share the purest pixel gaming experiences — playable right in your browser.
      </p>

      <p>
        📅 Founded in 2026. Our mission: a pixel utopia combining game library, community, and retro culture.
        Every game is hand-picked and preserved for future generations of pixel lovers.
      </p>

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

const team: TeamMember[] = [
  { avatar: '👨‍💻', name: 'PixelDriver', role: 'Founder' },
  { avatar: '🎨', name: 'PixelArtist', role: 'Art Director' },
  { avatar: '🕹️', name: 'ArcadeManiac', role: 'Designer' },
  { avatar: '📝', name: 'RetroWriter', role: 'Editor' },
]

useSeoMeta({
  title: 'About RetroVault — Retro Gaming Community',
  description: 'Learn about RetroVault — our mission, team, and passion for preserving pixel gaming history. Play retro games online free.',
  ogTitle: 'About RetroVault',
  ogDescription: 'Retro gaming site built by enthusiasts. Preserving pixel gaming experiences.',
  ogType: 'website',
})
</script>
