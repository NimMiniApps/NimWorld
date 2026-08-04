<script setup lang="ts">
import { computed } from 'vue'
import { usePlazaStore } from '@/stores/plazaStore'
import {
  BOTTOM_NAV_ITEMS,
  locationIdForNav,
  navIdsForLocation,
  type BottomNavId,
} from './bottomNav'

const ICONS: Record<BottomNavId, string> = {
  home: '⌂',
  apps: '▦',
  inventory: '⧉',
  achievements: '✦',
  friends: '☺',
  wallet: '◈',
}

const store = usePlazaStore()
const activeIds = computed(() => new Set(navIdsForLocation(store.openLocationId)))

function onSelect(id: BottomNavId) {
  const locationId = locationIdForNav(id)
  if (!locationId) {
    store.closeLocation()
    return
  }
  void store.openLocation(locationId)
}
</script>

<template>
  <nav class="nw-panel bottom-nav" aria-label="Plaza">
    <button
      v-for="item in BOTTOM_NAV_ITEMS"
      :key="item.id"
      type="button"
      class="nav-item"
      :class="{ active: activeIds.has(item.id) }"
      @click="onSelect(item.id)"
    >
      <span class="icon" aria-hidden="true">{{ ICONS[item.id] }}</span>
      <span class="label">{{ item.label }}</span>
    </button>
  </nav>
</template>

<style scoped>
.bottom-nav {
  display: flex;
  align-items: stretch;
  gap: 0.2rem;
  padding: 0.4rem;
  pointer-events: auto;
  border-color: rgba(88, 196, 255, 0.28);
  box-shadow:
    0 12px 40px rgba(0, 0, 0, 0.4),
    0 0 18px rgba(88, 196, 255, 0.12);
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.28rem;
  min-width: 3.6rem;
  padding: 0.45rem 0.35rem;
  border: 1px solid transparent;
  border-radius: 12px;
  background: transparent;
  color: var(--nw-muted);
  cursor: pointer;
  transition:
    color 140ms ease,
    background 140ms ease,
    border-color 140ms ease,
    box-shadow 140ms ease;
}

.nav-item:hover {
  color: var(--nw-text);
  background: rgba(88, 196, 255, 0.08);
}

.nav-item.active {
  color: var(--nw-cyan);
  background: rgba(88, 196, 255, 0.14);
  border-color: rgba(88, 196, 255, 0.55);
  box-shadow: 0 0 12px rgba(88, 196, 255, 0.35);
}

.icon {
  font-size: 1rem;
  line-height: 1;
}

.label {
  font-family: var(--nw-font-pixel);
  font-size: 0.38rem;
  letter-spacing: 0.02em;
  line-height: 1.2;
  text-align: center;
}

@media (max-width: 520px) {
  .nav-item {
    min-width: 2.7rem;
    padding: 0.4rem 0.2rem;
  }

  .label {
    font-size: 0.32rem;
  }
}
</style>
