<script setup lang="ts">
import { usePlazaStore } from '@/stores/plazaStore'

const store = usePlazaStore()
</script>

<template>
  <div class="nw-panel chip" v-if="store.profile">
    <div class="avatar" aria-hidden="true">
      <img
        v-if="store.profile.avatarDataUrl"
        :src="store.profile.avatarDataUrl"
        alt=""
      />
      <span v-else>{{ (store.profile.handle ?? 'N').slice(0, 1).toUpperCase() }}</span>
    </div>
    <div class="meta">
      <p class="display name">
        {{ store.profile.handle ? `@${store.profile.handle}` : 'Guest' }}
      </p>
      <p class="source">
        {{ store.profile.source === 'nimconnect' ? 'NimConnect' : 'Mock identity' }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.chip {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.55rem 0.75rem;
  min-width: 10.5rem;
  border-color: rgba(88, 196, 255, 0.35);
  box-shadow:
    0 12px 40px rgba(0, 0, 0, 0.35),
    0 0 0 1px rgba(88, 196, 255, 0.08);
}

.avatar {
  width: 2.35rem;
  height: 2.35rem;
  border-radius: 10px;
  background: linear-gradient(145deg, var(--nw-gold), #ff8a3d);
  display: grid;
  place-items: center;
  font-family: var(--nw-font-display);
  font-weight: 800;
  color: #1a1204;
  overflow: hidden;
  border: 1px solid rgba(245, 166, 35, 0.45);
  flex-shrink: 0;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.name {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.source {
  margin: 0.12rem 0 0;
  font-size: 0.68rem;
  color: var(--nw-muted);
}
</style>
