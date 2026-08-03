<script setup lang="ts">
import { usePlazaStore } from '@/stores/plazaStore'

const store = usePlazaStore()
</script>

<template>
  <div class="stack">
    <p class="display title">Marketplace</p>
    <p class="eyebrow">Payments open · trading soon</p>
    <p class="muted">
      Tip the NimWorld jar or copy a NIM request link. Handles, cosmetics, and collectibles
      trading stay under construction.
    </p>

    <div class="actions">
      <button class="nw-btn nw-btn-primary" type="button" @click="store.openPaymentSheet({ mode: 'tip' })">
        Tip NimWorld
      </button>
      <button
        class="nw-btn nw-btn-secondary"
        type="button"
        @click="store.openPaymentSheet({ mode: 'request' })"
      >
        Request NIM
      </button>
    </div>

    <ul>
      <li>Handles</li>
      <li>Cosmetics</li>
      <li>Collectibles</li>
      <li>App-local items (clearly labelled)</li>
    </ul>
    <p class="hint">Watch the site in the plaza — progress will show in the world first.</p>
  </div>
</template>

<style scoped>
.stack {
  display: grid;
  gap: 0.65rem;
}

.title {
  margin: 0;
  color: var(--nw-gold);
}

.eyebrow {
  margin: 0;
  font-family: Sora, sans-serif;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--nw-green);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.muted {
  margin: 0;
  color: var(--nw-muted);
  line-height: 1.45;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
}

.hint {
  margin: 0;
  color: var(--nw-muted);
  font-size: 0.85rem;
  line-height: 1.4;
}

ul {
  margin: 0;
  padding-left: 1.1rem;
  color: var(--nw-text);
}
</style>
