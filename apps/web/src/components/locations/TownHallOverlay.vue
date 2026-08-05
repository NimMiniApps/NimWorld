<script setup lang="ts">
import { computed } from 'vue'
import { activityAgeLabel, type ActivityEntry } from '@/adapters/events/activityFeed'
import { usePlazaStore } from '@/stores/plazaStore'
import IdenticonAvatar from '@/components/hud/IdenticonAvatar.vue'

const store = usePlazaStore()

function openCatalog() {
  window.open('https://nimiqminiapps.com', '_blank', 'noopener,noreferrer')
}

/** Apps report an id; the catalog knows the name humans read. */
const appNames = computed(() => {
  const names = new Map<string, string>()
  for (const app of [...store.featuredApps, ...store.arcadeApps]) {
    names.set(app.id, app.name)
    names.set(app.slug, app.name)
  }
  return names
})

function appName(entry: ActivityEntry) {
  return appNames.value.get(entry.appId) ?? entry.appId
}

function playerLabel(address: string) {
  const compact = address.replace(/\s+/g, '')
  return compact.length <= 12 ? compact : `${compact.slice(0, 8)}…`
}
</script>

<template>
  <div class="stack">
    <p class="muted">
      Featured Mini Apps from the NimiqMiniApps catalog
      <template v-if="store.catalogSource === 'world'"> (NimWorld registry)</template>
      <template v-else-if="store.catalogSource === 'fallback'"> (local fallback)</template>.
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

    <section class="feed">
      <h3 class="display">Plaza activity</h3>
      <p class="muted" v-if="!store.activityFeed.length">
        Nothing yet. Apps post activity here when players do something worth sharing.
      </p>
      <ul v-else>
        <li v-for="(entry, i) in store.activityFeed" :key="`${entry.address}-${entry.ts}-${i}`">
          <IdenticonAvatar :address="entry.address" :fallback="entry.address" size="1.7rem" />
          <button
            class="entry"
            type="button"
            @click="store.openProfileSheet(entry.address, playerLabel(entry.address))"
          >
            <p class="line">
              <span class="who">{{ playerLabel(entry.address) }}</span>
              {{ entry.text }}
            </p>
            <p class="muted small">{{ appName(entry) }} · {{ activityAgeLabel(entry.ts) }}</p>
          </button>
        </li>
      </ul>
    </section>
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

.feed {
  display: grid;
  gap: 0.5rem;
  border-top: 1px solid var(--nw-panel-border);
  padding-top: 0.7rem;
}

.feed h3 {
  margin: 0;
  font-size: 0.95rem;
}

.feed li {
  display: flex;
  gap: 0.6rem;
  align-items: center;
  border-bottom: none;
}

.entry {
  flex: 1;
  min-width: 0;
  background: none;
  border: 0;
  padding: 0;
  text-align: left;
  color: inherit;
  cursor: pointer;
}

.line {
  margin: 0;
}

.who {
  font-weight: 600;
}

.small {
  font-size: 0.78rem;
}
</style>
