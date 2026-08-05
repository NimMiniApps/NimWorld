<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import IdenticonAvatar from '@/components/hud/IdenticonAvatar.vue'
import { usePlazaStore } from '@/stores/plazaStore'

const store = usePlazaStore()
const requestError = ref<string | null>(null)

const sheet = computed(() => store.profileSheet)
const profile = computed(() => sheet.value?.profile ?? null)
const name = computed(
  () => profile.value?.displayName || profile.value?.handle || sheet.value?.fallbackLabel || 'Player',
)

/** The NimConnect friendship, when there is one — drives the badge and the actions. */
const friendship = computed(() =>
  store.friends
    .concat(store.friendRequests)
    .find((f) => f.address && f.address === sheet.value?.address),
)
const canAddFriend = computed(
  () => store.friendsConnected && !friendship.value && Boolean(profile.value),
)

watch(sheet, () => {
  requestError.value = null
})

function sendNim() {
  const current = sheet.value
  if (!current) return
  store.closeProfileSheet()
  store.openPaymentSheet({ mode: 'send', recipient: current.address, recipientLabel: name.value })
}

/** The link is addressed to us; the label only says who to hand it to. */
function requestNim() {
  if (!sheet.value) return
  store.closeProfileSheet()
  store.openPaymentSheet({ mode: 'request', recipientLabel: name.value })
}

async function addFriend() {
  const address = sheet.value?.address
  if (!address) return
  requestError.value = null
  try {
    await store.sendFriendRequest(address)
    store.closeProfileSheet()
  } catch (e) {
    requestError.value = e instanceof Error ? e.message : 'Could not send the request'
  }
}
</script>

<template>
  <div v-if="sheet" class="backdrop" @click.self="store.closeProfileSheet()">
    <section class="nw-panel sheet" role="dialog" :aria-label="`Profile of ${name}`">
      <header>
        <IdenticonAvatar :address="sheet.address" :fallback="name" size="3rem" />
        <div class="who">
          <h2 class="display">{{ name }}</h2>
          <p v-if="profile?.handle" class="handle">@{{ profile.handle }}</p>
          <p class="address">{{ sheet.address }}</p>
        </div>
        <button class="nw-btn nw-btn-ghost" type="button" @click="store.closeProfileSheet()">
          Close
        </button>
      </header>

      <p v-if="friendship" class="nw-hud-badge friendship">{{ friendship.statusLabel }}</p>

      <p v-if="sheet.loading" class="note">Looking up NimConnect…</p>
      <p v-else-if="profile?.bio" class="bio">{{ profile.bio }}</p>
      <p v-else-if="!profile" class="note">No NimConnect profile for this address yet.</p>

      <div class="actions">
        <button class="nw-btn nw-btn-primary" type="button" @click="sendNim">Send NIM</button>
        <button class="nw-btn nw-btn-secondary" type="button" @click="requestNim">Request NIM</button>
        <button
          v-if="canAddFriend"
          class="nw-btn nw-btn-secondary"
          type="button"
          :disabled="store.friendsBusy"
          @click="addFriend"
        >
          {{ store.friendsBusy ? 'Sending…' : 'Add friend' }}
        </button>
        <button
          v-if="profile?.handle"
          class="nw-btn nw-btn-secondary"
          type="button"
          @click="store.openNimConnectProfile(profile.handle)"
        >
          View on NimConnect
        </button>
      </div>

      <p v-if="requestError" class="error">{{ requestError }}</p>
    </section>
  </div>
</template>

<style scoped>
.backdrop {
  position: absolute;
  inset: 0;
  z-index: 50;
  background: rgba(5, 8, 20, 0.55);
  display: grid;
  place-items: end center;
  padding: 0.75rem;
  padding-bottom: calc(0.75rem + env(safe-area-inset-bottom));
}

.sheet {
  width: min(420px, 100%);
  padding: 1rem 1.1rem 1.2rem;
  display: grid;
  gap: 0.75rem;
}

header {
  display: flex;
  gap: 0.75rem;
  align-items: start;
}

.who {
  flex: 1;
  min-width: 0;
}

h2 {
  margin: 0;
  font-size: 1.15rem;
}

.handle {
  margin: 0.1rem 0 0;
  font-size: 0.85rem;
  color: var(--nw-gold);
}

.address {
  margin: 0.25rem 0 0;
  font-size: 0.72rem;
  color: var(--nw-muted);
  word-break: break-all;
}

.bio {
  margin: 0;
  font-size: 0.88rem;
}

.friendship {
  margin: 0;
  justify-self: start;
  color: var(--nw-green);
  border-color: rgba(79, 209, 165, 0.45);
}

.note {
  margin: 0;
  font-size: 0.82rem;
  color: var(--nw-muted);
}

.error {
  margin: 0;
  font-size: 0.8rem;
  color: #ff8a8a;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
</style>
