<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount } from 'vue'
import { usePlazaStore } from '@/stores/plazaStore'
import ArenaOverlay from '@/components/locations/ArenaOverlay.vue'
import ArcadeOverlay from '@/components/locations/ArcadeOverlay.vue'
import FountainOverlay from '@/components/locations/FountainOverlay.vue'
import TownHallOverlay from '@/components/locations/TownHallOverlay.vue'
import SocialClubOverlay from '@/components/locations/SocialClubOverlay.vue'
import MarketplaceOverlay from '@/components/locations/MarketplaceOverlay.vue'

const store = usePlazaStore()

const title = computed(() => {
  switch (store.openLocationId) {
    case 'fountain':
      return 'NimConnect Fountain'
    case 'arena':
      return 'NimBomber Arena'
    case 'arcade':
      return 'Arcade'
    case 'town-hall':
      return 'Town Hall'
    case 'social-club':
      return 'Social Club'
    case 'marketplace':
      return 'Marketplace · Construction'
    default:
      return 'Location'
  }
})

function onKey(event: KeyboardEvent) {
  if (event.key === 'Escape') store.closeLocation()
}

onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div v-if="store.openLocationId" class="backdrop">
    <section class="nw-panel sheet" role="dialog" :aria-label="title">
      <header>
        <div>
          <p class="eyebrow">Plaza location</p>
          <h2 class="display">{{ title }}</h2>
        </div>
        <button class="nw-btn nw-btn-ghost" type="button" @click="store.closeLocation()">
          Close
        </button>
      </header>

      <FountainOverlay v-if="store.openLocationId === 'fountain'" />
      <ArenaOverlay v-else-if="store.openLocationId === 'arena'" />
      <ArcadeOverlay v-else-if="store.openLocationId === 'arcade'" />
      <TownHallOverlay v-else-if="store.openLocationId === 'town-hall'" />
      <SocialClubOverlay v-else-if="store.openLocationId === 'social-club'" />
      <MarketplaceOverlay v-else-if="store.openLocationId === 'marketplace'" />
    </section>
  </div>
</template>

<style scoped>
.backdrop {
  position: absolute;
  inset: 0;
  z-index: 40;
  background: rgba(5, 8, 20, 0.45);
  /* Panel is non-modal: joystick and canvas stay reachable while it is open. */
  pointer-events: none;
  display: grid;
  /* Top-anchored so the joystick and bottom nav stay clear while walking. */
  place-items: start center;
  padding: 0.75rem;
  padding-top: calc(3.5rem + env(safe-area-inset-top));
}

.sheet {
  pointer-events: auto;
  width: min(760px, 100%);
  max-height: min(62vh, 720px);
  overflow: auto;
  padding: 1rem 1.1rem 1.2rem;
  animation: sheet-in 280ms ease both;
}

header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: start;
  margin-bottom: 0.85rem;
}

.eyebrow {
  margin: 0;
  color: var(--nw-cyan);
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

h2 {
  margin: 0.15rem 0 0;
  font-size: 1.35rem;
}

@keyframes sheet-in {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (min-width: 900px) {
  .backdrop {
    place-items: center;
  }
}
</style>
