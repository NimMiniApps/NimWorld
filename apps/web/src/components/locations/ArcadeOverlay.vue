<script setup lang="ts">
import { computed, ref } from 'vue'
import { usePlazaStore } from '@/stores/plazaStore'
import { isConnected, isPlayed } from './arcadeBadges'

const store = usePlazaStore()
const query = ref('')

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return store.arcadeApps
  return store.arcadeApps.filter(
    (app) => app.name.toLowerCase().includes(q) || app.slug.toLowerCase().includes(q),
  )
})

async function launch(app: { id: string; slug: string; launchUrl: string; name?: string }) {
  await store.launchApp(app.slug || app.id, app.launchUrl, app.name)
}

/** Recent launches, newest first — the plaza's own record, not a catalog field. */
const recent = computed(() =>
  store.launchHistory.map((entry) => ({
    ...entry,
    when: relativeTime(entry.launchedAt),
  })),
)

const playedAppIds = computed(() => new Set(store.launchHistory.map((e) => e.appId)))

function connected(app: { id: string; slug: string }): boolean {
  return isConnected(app, store.authorizedAudiences)
}

function played(app: { id: string; slug: string }): boolean {
  return isPlayed(app, playedAppIds.value)
}

function relativeTime(at: number): string {
  const minutes = Math.round((Date.now() - at) / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.round(hours / 24)}d ago`
}
</script>

<template>
  <div class="stack">
    <p class="muted">
      Scalable games portal. Seeded from manifests and the NimiqMiniApps catalog when available.
      Connected means a live NimConnect grant; Played is your local launch history.
    </p>

    <section v-if="recent.length" class="recent">
      <h3 class="display heading">Recently played</h3>
      <ul class="chips">
        <li v-for="entry in recent" :key="entry.appId">
          <button
            class="chip"
            type="button"
            @click="store.launchApp(entry.appId, entry.launchUrl, entry.name)"
          >
            <span class="chip-name">{{ entry.name }}</span>
            <span class="chip-when">{{ entry.when }}</span>
          </button>
        </li>
      </ul>
    </section>

    <label class="search">
      <span>Search</span>
      <input v-model="query" type="search" placeholder="NimBomber, PlayNimiq…" />
    </label>

    <ul>
      <li v-for="app in filtered" :key="app.id">
        <div class="row">
          <img v-if="app.iconUrl" :src="app.iconUrl" alt="" width="40" height="40" />
          <div>
            <p class="display name">
              {{ app.name }}
              <span v-if="connected(app)" class="connected">Connected</span>
              <span v-if="played(app)" class="played">Played</span>
            </p>
            <p class="muted">{{ app.tagline || app.category }}</p>
          </div>
        </div>
        <button class="nw-btn nw-btn-primary" type="button" @click="launch(app)">
          {{ played(app) ? 'Play again' : 'Launch' }}
        </button>
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

.recent {
  display: grid;
  gap: 0.45rem;
}

.connected,
.played {
  margin-left: 0.4rem;
  padding: 0.05rem 0.4rem;
  border-radius: 999px;
  font-size: 0.68rem;
  font-weight: 600;
  vertical-align: middle;
}

.connected {
  color: #1a1408;
  background: linear-gradient(135deg, #f0c35a, #e8a838);
  border: 1px solid rgba(240, 195, 90, 0.8);
}

.played {
  color: var(--nw-muted);
  border: 1px solid var(--nw-panel-border);
}

.heading {
  margin: 0;
  font-size: 0.9rem;
}

.chips {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.chip {
  display: grid;
  gap: 0.1rem;
  text-align: left;
  border-radius: 10px;
  border: 1px solid var(--nw-panel-border);
  background: rgba(88, 196, 255, 0.1);
  color: var(--nw-text);
  font: inherit;
  padding: 0.4rem 0.6rem;
  cursor: pointer;
}

.chip:hover {
  background: rgba(88, 196, 255, 0.2);
}

.chip-name {
  font-size: 0.8rem;
  font-weight: 700;
}

.chip-when {
  font-size: 0.68rem;
  color: var(--nw-muted);
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
