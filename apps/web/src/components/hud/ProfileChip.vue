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
        {{ store.profile.source === 'nimconnect' ? 'NimConnect profile' : 'Mock identity' }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.chip {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem 0.85rem;
  min-width: 11rem;
}

.avatar {
  width: 2.4rem;
  height: 2.4rem;
  border-radius: 999px;
  background: linear-gradient(145deg, var(--nw-gold), #ff8a3d);
  display: grid;
  place-items: center;
  font-family: var(--nw-font-display);
  font-weight: 800;
  color: #1a1204;
  overflow: hidden;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.name {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
}

.source {
  margin: 0.1rem 0 0;
  font-size: 0.72rem;
  color: var(--nw-muted);
}
</style>
