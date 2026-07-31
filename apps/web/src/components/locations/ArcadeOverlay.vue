<script setup lang="ts">
import { computed, ref } from 'vue'
import { usePlazaStore } from '@/stores/plazaStore'

const store = usePlazaStore()
const query = ref('')

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return store.arcadeApps
  return store.arcadeApps.filter(
    (app) => app.name.toLowerCase().includes(q) || app.slug.toLowerCase().includes(q),
  )
})

async function launch(app: { id: string; slug: string; launchUrl: string }) {
  await store.launchApp(app.slug || app.id, app.launchUrl)
}
</script>

<template>
  <div class="stack">
    <p class="muted">
      Scalable games portal. Seeded from manifests and the NimiqMiniApps catalog when available.
    </p>

    <label class="search">
      <span>Search</span>
      <input v-model="query" type="search" placeholder="NimBomber, PlayNimiq…" />
    </label>

    <ul>
      <li v-for="app in filtered" :key="app.id">
        <div class="row">
          <img v-if="app.iconUrl" :src="app.iconUrl" alt="" width="40" height="40" />
          <div>
            <p class="display name">{{ app.name }}</p>
            <p class="muted">{{ app.tagline || app.category }}</p>
          </div>
        </div>
        <button class="nw-btn nw-btn-primary" type="button" @click="launch(app)">Launch</button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.stack {
  display: grid;
  gap: 0.85rem;
}

.muted {
  color: var(--nw-muted);
  margin: 0;
}

.search {
  display: grid;
  gap: 0.35rem;
  font-size: 0.8rem;
  color: var(--nw-muted);
}

input {
  border-radius: 12px;
  border: 1px solid var(--nw-panel-border);
  background: rgba(8, 12, 28, 0.7);
  color: var(--nw-text);
  padding: 0.7rem 0.8rem;
}

ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.7rem;
}

li {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  align-items: center;
  padding: 0.55rem 0;
  border-bottom: 1px solid var(--nw-panel-border);
}

.row {
  display: flex;
  gap: 0.65rem;
  align-items: center;
  min-width: 0;
}

.row img {
  border-radius: 10px;
}

.name {
  margin: 0;
  font-size: 1rem;
}
</style>
