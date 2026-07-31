<script setup lang="ts">
import { worldBridge } from '@/game/bridge/WorldBridge'
import { usePlazaStore } from '@/stores/plazaStore'

const store = usePlazaStore()

function activate() {
  worldBridge.emitUi({ type: 'TRIGGER_INTERACT' })
}
</script>

<template>
  <button
    v-if="store.interaction && !store.openLocationId"
    class="nw-panel prompt"
    type="button"
    @click="activate"
  >
    <span class="key">Tap / Enter</span>
    <span class="display label">{{ store.interaction.label }}</span>
  </button>
</template>

<style scoped>
.prompt {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  padding: 0.85rem 1.2rem;
  border: 1px solid rgba(245, 166, 35, 0.45);
  animation: rise 420ms ease both;
}

.key {
  font-size: 0.7rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--nw-gold);
}

.label {
  font-size: 1.05rem;
  font-weight: 700;
}

@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
