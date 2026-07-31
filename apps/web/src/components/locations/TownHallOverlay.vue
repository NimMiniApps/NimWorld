<script setup lang="ts">
import { usePlazaStore } from '@/stores/plazaStore'

const store = usePlazaStore()

function openCatalog() {
  window.open('https://nimiqminiapps.com', '_blank', 'noopener,noreferrer')
}
</script>

<template>
  <div class="stack">
    <p class="muted">
      Featured Mini Apps from the NimiqMiniApps catalog
      <template v-if="store.catalogSource === 'fallback'"> (local fallback)</template>.
    </p>

    <ul>
      <li v-for="app in store.featuredApps" :key="app.id">
        <div class="row">
          <img v-if="app.iconUrl" :src="app.iconUrl" alt="" width="40" height="40" />
          <div>
            <p class="display name">{{ app.name }}</p>
            <p class="muted">{{ app.tagline || app.category }}</p>
          </div>
        </div>
      </li>
    </ul>

    <button class="nw-btn nw-btn-primary" type="button" @click="openCatalog">
      Open NimiqMiniApps
    </button>
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

ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.7rem;
}

li {
  padding: 0.4rem 0;
  border-bottom: 1px solid var(--nw-panel-border);
}

.row {
  display: flex;
  gap: 0.65rem;
  align-items: center;
}

.row img {
  border-radius: 10px;
}

.name {
  margin: 0;
}
</style>
