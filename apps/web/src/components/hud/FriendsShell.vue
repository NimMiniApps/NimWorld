<script setup lang="ts">
import { computed } from 'vue'
import { usePlazaStore } from '@/stores/plazaStore'
import IdenticonAvatar from './IdenticonAvatar.vue'

const store = usePlazaStore()

const rows = computed(() =>
  store.friends.slice(0, 5).map((f) => ({
    key: f.address ?? f.handle,
    handle: f.handle ? `@${f.handle}` : f.displayName,
    // NimConnect shares the friendship, not plaza presence.
    place: f.statusLabel,
    address: f.address ?? '',
  })),
)

const pending = computed(() =>
  store.friendRequests.filter((r) => r.status === 'pending_in').length,
)
</script>

<template>
  <aside class="nw-panel shell friends-shell" aria-label="Friends">
    <header class="head">
      <h2 class="title">Friends</h2>
      <span v-if="pending" class="nw-hud-badge pending">{{ pending }} new</span>
    </header>

    <ul class="list" v-if="rows.length">
      <li v-for="friend in rows" :key="friend.key">
        <IdenticonAvatar :address="friend.address" :fallback="friend.handle" size="2.1rem" />
        <button
          class="meta"
          type="button"
          :disabled="!friend.address"
          @click="store.openProfileSheet(friend.address, friend.handle)"
        >
          <p class="handle">{{ friend.handle }}</p>
          <p class="place">{{ friend.place }}</p>
        </button>
      </li>
    </ul>
    <p v-else class="empty">
      {{ store.friendsConnected ? 'No friends yet.' : 'Connect NimConnect to see your friends.' }}
    </p>

    <button class="view-all" type="button" @click="store.openLocation('social-club')">
      {{ store.friendsConnected ? 'View All Friends' : 'Connect Friends' }}
    </button>
  </aside>
</template>

<style scoped>
.friends-shell {
  display: none;
  width: min(15.5rem, 22vw);
  padding: 0.6rem;
  border-color: rgba(155, 123, 255, 0.35);
  pointer-events: auto;
}

.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.title {
  margin: 0;
  font-family: var(--nw-font-pixel);
  font-size: 0.48rem;
  letter-spacing: 0.03em;
  color: var(--nw-text);
}

.list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.4rem;
}

.list li {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.3rem;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.03);
}

.meta {
  min-width: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  padding: 0;
  cursor: pointer;
}

/* Mock friends carry no address, so there is nothing to look up. */
.meta:disabled {
  cursor: default;
}

.handle {
  margin: 0;
  font-size: 0.8rem;
  font-weight: 700;
}

.place {
  margin: 0.1rem 0 0;
  font-size: 0.68rem;
  color: var(--nw-muted);
}

.empty {
  margin: 0;
  font-size: 0.72rem;
  color: var(--nw-muted);
  padding: 0.2rem 0.3rem;
}

.pending {
  color: var(--nw-green);
  border-color: rgba(79, 209, 165, 0.45);
}

.view-all {
  width: 100%;
  margin-top: 0.55rem;
  border-radius: 10px;
  border: 1px solid var(--nw-panel-border);
  background: rgba(155, 123, 255, 0.12);
  color: var(--nw-text);
  padding: 0.45rem 0.6rem;
  font-size: 0.72rem;
  font-weight: 700;
  cursor: pointer;
}

.view-all:hover {
  background: rgba(155, 123, 255, 0.22);
}

@media (min-width: 900px) {
  .friends-shell {
    display: block;
  }
}
</style>
