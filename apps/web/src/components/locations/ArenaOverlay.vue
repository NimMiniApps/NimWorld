<script setup lang="ts">
import { nimbomberManifest } from '@nimworld/app-manifest'
import { usePlazaStore } from '@/stores/plazaStore'

const store = usePlazaStore()

async function play() {
  await store.launchApp(nimbomberManifest.id, nimbomberManifest.launchUrl)
}
</script>

<template>
  <div class="stack" v-if="store.arenaStatus">
    <div class="brand">
      <img :src="nimbomberManifest.iconUrl" alt="" width="48" height="48" />
      <div>
        <p class="display">NimBomber</p>
        <p class="muted">{{ nimbomberManifest.description }}</p>
      </div>
    </div>

    <p class="source">
      Status source:
      <strong>{{ store.arenaStatus.source === 'mock' ? 'mock adapter' : 'live' }}</strong>
    </p>

    <section>
      <h3 class="display">Daily challenge</h3>
      <p>{{ store.arenaStatus.dailyChallenge.title }}</p>
      <p class="muted">{{ store.arenaStatus.dailyChallenge.progressLabel }}</p>
    </section>

    <section>
      <h3 class="display">Weekly tournament</h3>
      <p>{{ store.arenaStatus.weeklyTournament.title }}</p>
      <p class="muted">{{ store.arenaStatus.weeklyTournament.statusLabel }}</p>
    </section>

    <section>
      <h3 class="display">Your stats</h3>
      <div class="stats">
        <div v-for="stat in store.arenaStatus.stats" :key="stat.label">
          <strong>{{ stat.value }}</strong>
          <span>{{ stat.label }}</span>
        </div>
      </div>
    </section>

    <section>
      <h3 class="display">Recent players</h3>
      <ul>
        <li v-for="player in store.arenaStatus.recentPlayers" :key="player.handle">
          @{{ player.handle }} — {{ player.statusLabel }}
        </li>
      </ul>
    </section>

    <section>
      <h3 class="display">Leaderboard</h3>
      <ul>
        <li v-for="row in store.arenaStatus.leaderboardPreview" :key="row.rank">
          #{{ row.rank }} @{{ row.handle }} · {{ row.score }}
        </li>
      </ul>
    </section>

    <div class="actions">
      <button class="nw-btn nw-btn-primary" type="button" @click="play">Play NimBomber</button>
      <button class="nw-btn nw-btn-secondary" type="button" disabled>Challenge friend</button>
    </div>
  </div>
  <p v-else class="muted">Loading arena status…</p>
</template>

<style scoped>
.stack {
  display: grid;
  gap: 0.9rem;
}

.brand {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.brand img {
  border-radius: 12px;
}

.display {
  margin: 0;
}

.muted,
.source {
  color: var(--nw-muted);
  margin: 0.2rem 0 0;
}

.source strong {
  color: var(--nw-gold);
}

h3 {
  margin: 0 0 0.3rem;
  font-size: 0.95rem;
}

.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
}

.stats div {
  display: grid;
  gap: 0.15rem;
}

.stats span,
ul {
  color: var(--nw-muted);
  font-size: 0.88rem;
}

ul {
  margin: 0;
  padding-left: 1rem;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}
</style>
