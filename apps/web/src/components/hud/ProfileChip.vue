<script setup lang="ts">
import { computed } from 'vue'
import { usePlazaStore } from '@/stores/plazaStore'
import IdenticonAvatar from './IdenticonAvatar.vue'
import { HUD_ICON, PREVIEW_PROFILE_STATS } from './hudPreviewData'

const store = usePlazaStore()
const stats = PREVIEW_PROFILE_STATS
const xpPct = computed(() => Math.min(100, (stats.xp / stats.xpMax) * 100))

// Friends are the one real stat here — the rest stay preview until they have a source.
const friendCount = computed(() => store.friends.length)
</script>

<template>
  <div class="nw-panel chip" v-if="store.profile">
    <IdenticonAvatar
      :address="store.profile.address"
      :fallback="store.profile.handle ?? 'N'"
      size="2.6rem"
    />
    <div class="meta">
      <div class="row">
        <p class="display name">
          {{ store.profile.handle ? `@${store.profile.handle}` : 'Guest' }}
        </p>
        <span class="level">Level {{ stats.level }}</span>
      </div>
      <div class="xp" :title="'Preview XP — not live progression'">
        <div class="xp-fill" :style="{ width: `${xpPct}%` }" />
        <span class="xp-label">{{ stats.xp.toLocaleString() }} / {{ stats.xpMax.toLocaleString() }} XP</span>
      </div>
      <div class="stat-row">
        <span class="stat" title="Achievements (preview)">
          <img :src="HUD_ICON.achievements" alt="" class="stat-icon" />
          {{ stats.trophies }}
        </span>
        <span
          class="stat"
          :class="{ live: store.friendsConnected }"
          :title="store.friendsConnected ? 'Friends on NimConnect' : 'Friends (preview)'"
        >
          <img :src="HUD_ICON.friends" alt="" class="stat-icon" />
          {{ friendCount }}
        </span>
        <span class="stat" title="Apps (preview)">
          <img :src="HUD_ICON.apps" alt="" class="stat-icon" />
          {{ stats.apps }}
        </span>
        <span class="nw-hud-badge">Preview</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chip {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.5rem 0.7rem;
  width: 100%;
  min-width: 13rem;
  max-width: 20rem;
  border-color: rgba(88, 196, 255, 0.35);
  box-shadow:
    0 12px 40px rgba(0, 0, 0, 0.35),
    0 0 0 1px rgba(88, 196, 255, 0.08);
}

.meta {
  flex: 1;
  min-width: 0;
}

.row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
}

.name {
  margin: 0;
  font-size: 0.92rem;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.level {
  font-size: 0.68rem;
  color: var(--nw-muted);
  white-space: nowrap;
}

.xp {
  position: relative;
  margin-top: 0.3rem;
  height: 0.9rem;
  border-radius: 999px;
  background: rgba(8, 10, 24, 0.75);
  border: 1px solid rgba(155, 123, 255, 0.35);
  overflow: hidden;
}

.xp-fill {
  position: absolute;
  inset: 0 auto 0 0;
  background: linear-gradient(90deg, #7b5cff, var(--nw-purple));
  box-shadow: 0 0 10px rgba(155, 123, 255, 0.45);
}

.xp-label {
  position: relative;
  z-index: 1;
  display: grid;
  place-items: center;
  height: 100%;
  font-size: 0.58rem;
  font-weight: 700;
  color: var(--nw-text);
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.65);
}

.stat-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.3rem;
  flex-wrap: wrap;
}

.stat {
  display: inline-flex;
  align-items: center;
  gap: 0.22rem;
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--nw-text);
}

.stat.live {
  color: var(--nw-green);
}

.stat-icon {
  width: 0.95rem;
  height: 0.95rem;
  object-fit: contain;
  image-rendering: pixelated;
}
</style>
