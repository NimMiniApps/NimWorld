<script setup lang="ts">
import { ref } from 'vue'
import { isPayableActor } from '@/adapters/presence/PresenceAdapter'
import { usePlazaStore } from '@/stores/plazaStore'
import IdenticonAvatar from './IdenticonAvatar.vue'

const store = usePlazaStore()
const expanded = ref(false)

function sendTo(actor: { label: string; address?: string }) {
  if (!actor.address) return
  store.openPaymentSheet({
    mode: 'send',
    recipient: actor.address,
    recipientLabel: actor.label,
  })
}
</script>

<template>
  <div class="nearby nw-panel" v-if="store.nearbyActors.length">
    <button class="toggle" type="button" @click="expanded = !expanded">
      <span>Nearby</span>
      <span class="count">{{ store.nearbyActors.length }}</span>
    </button>

    <ul v-if="expanded">
      <li v-for="actor in store.nearbyActors" :key="actor.id">
        <IdenticonAvatar :address="actor.address" :fallback="actor.label" size="1.9rem" />
        <div class="meta">
          <p class="label">{{ actor.label }}</p>
          <p class="status">{{ actor.statusLabel }}</p>
        </div>
        <button
          v-if="isPayableActor(actor)"
          class="nw-btn nw-btn-secondary send"
          type="button"
          @click="sendTo(actor)"
        >
          Send
        </button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.nearby {
  position: relative;
  z-index: 22;
  width: 100%;
  padding: 0.45rem;
  border-color: rgba(88, 196, 255, 0.28);
}

.toggle {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  border: 0;
  background: transparent;
  color: var(--nw-text);
  font: inherit;
  font-weight: 700;
  cursor: pointer;
  padding: 0.35rem 0.45rem;
}

.count {
  font-size: 0.75rem;
  color: var(--nw-gold);
}

ul {
  list-style: none;
  margin: 0.25rem 0 0;
  padding: 0;
  display: grid;
  gap: 0.35rem;
  max-height: min(42vh, 18rem);
  overflow: auto;
}

li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.4rem 0.45rem;
  border-top: 1px solid var(--nw-panel-border);
}

.meta {
  flex: 1;
  min-width: 0;
}

.label {
  margin: 0;
  font-size: 0.86rem;
  font-weight: 700;
}

.status {
  margin: 0.1rem 0 0;
  font-size: 0.72rem;
  color: var(--nw-muted);
}

.send {
  flex-shrink: 0;
  padding: 0.35rem 0.55rem;
  font-size: 0.75rem;
}
</style>
