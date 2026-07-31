<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { createAdapters } from '@/adapters/createAdapters'
import type { PublicFriend } from '@/domain/types'

const friends = ref<PublicFriend[]>([])
const adapters = createAdapters()

onMounted(async () => {
  await adapters.nimconnect.initialize()
  friends.value = await adapters.nimconnect.getFriends()
})

async function view(handle: string) {
  await adapters.nimconnect.openProfile(handle)
}
</script>

<template>
  <div class="stack">
    <p class="muted">
      Friends and recent activity are <strong>mock data</strong> — NimConnect does not expose a
      friends API yet. Labels stay accurate (ghost / recently active), never fake live presence.
    </p>

    <ul>
      <li v-for="friend in friends" :key="friend.handle">
        <div>
          <p class="display">@{{ friend.handle }}</p>
          <p class="muted">{{ friend.statusLabel }} · {{ friend.presence }}</p>
        </div>
        <button class="nw-btn nw-btn-secondary" type="button" @click="view(friend.handle)">
          Profile
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
  line-height: 1.45;
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
  padding: 0.45rem 0;
  border-bottom: 1px solid var(--nw-panel-border);
}

.display {
  margin: 0;
  font-size: 1rem;
}
</style>
