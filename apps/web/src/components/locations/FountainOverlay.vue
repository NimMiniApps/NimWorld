<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { Achievement, InventoryItem } from '@/domain/types'
import { usePlazaStore } from '@/stores/plazaStore'

const store = usePlazaStore()
const achievements = ref<Achievement[]>([])
const inventory = ref<InventoryItem[]>([])

onMounted(async () => {
  const extras = await store.loadFountainExtras()
  achievements.value = extras.achievements
  inventory.value = extras.inventory
})
</script>

<template>
  <div class="stack">
    <p class="lead">
      Your identity hub. Public profile comes from NimConnect when available; friends,
      achievements, and inventory below are labelled mock data until those APIs exist.
    </p>

    <div class="identity" v-if="store.profile">
      <p class="display handle">
        {{ store.profile.handle ? `@${store.profile.handle}` : 'Guest' }}
      </p>
      <p>{{ store.profile.displayName || 'No display name' }}</p>
      <p class="muted">{{ store.profile.bio || 'No public bio yet.' }}</p>
      <p class="badge">{{ store.profile.source === 'nimconnect' ? 'Live NimConnect' : 'Mock identity' }}</p>
    </div>

    <div class="actions">
      <button
        class="nw-btn nw-btn-primary"
        type="button"
        @click="store.openNimConnectProfile(store.profile?.handle)"
      >
        View profile
      </button>
      <button class="nw-btn nw-btn-secondary" type="button" @click="store.openPaymentSheet({ mode: 'tip' })">
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

    <section>
      <h3 class="display">Achievements <span class="mock">mock</span></h3>
      <ul>
        <li v-for="item in achievements" :key="item.achievementId">
          <strong>{{ item.title }}</strong>
          <span>{{ item.description }}</span>
        </li>
        <li v-if="!achievements.length" class="muted">No achievements loaded yet.</li>
      </ul>
    </section>

    <section>
      <h3 class="display">Inventory <span class="mock">mock</span></h3>
      <ul>
        <li v-for="item in inventory" :key="`${item.namespace}:${item.itemId}`">
          <strong>{{ item.name }}</strong>
          <span>
            {{ item.portability === 'app-local' ? `Usable in ${item.usableIn?.join(', ')}` : 'Shared' }}
          </span>
        </li>
        <li v-if="!inventory.length" class="muted">No inventory loaded yet.</li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.stack {
  display: grid;
  gap: 1rem;
}

.lead,
.muted {
  color: var(--nw-muted);
  margin: 0;
  line-height: 1.45;
}

.identity {
  padding: 0.85rem 0;
  border-top: 1px solid var(--nw-panel-border);
  border-bottom: 1px solid var(--nw-panel-border);
}

.handle {
  margin: 0 0 0.25rem;
  font-size: 1.2rem;
}

.badge {
  display: inline-block;
  margin-top: 0.55rem;
  font-size: 0.72rem;
  color: var(--nw-gold);
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

h3 {
  margin: 0 0 0.45rem;
  font-size: 0.95rem;
}

.mock {
  color: var(--nw-pink);
  font-size: 0.7rem;
  font-family: var(--nw-font-body);
  font-weight: 700;
}

ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.55rem;
}

li {
  display: grid;
  gap: 0.15rem;
}

li span {
  color: var(--nw-muted);
  font-size: 0.85rem;
}
</style>
