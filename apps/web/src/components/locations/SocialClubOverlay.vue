<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { usePlazaStore } from '@/stores/plazaStore'
import type { PublicFriend } from '@/domain/types'

// Friends live in the store so this panel and the HUD never disagree.
const store = usePlazaStore()
const error = ref('')
const notice = ref('')
const invite = ref('')

const friends = computed(() => store.friends)
const connected = computed(() => store.friendsConnected)
const busy = computed(() => store.friendsBusy)
const incoming = computed(() => store.friendRequests.filter((r) => r.status === 'pending_in'))
const outgoing = computed(() => store.friendRequests.filter((r) => r.status === 'pending_out'))

onMounted(() => store.loadFriends())

/** Every mutation goes through here: one error line, one success line. */
async function run(action: () => Promise<void>, success = '') {
  error.value = ''
  notice.value = ''
  try {
    await action()
    notice.value = success
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Something went wrong'
  }
}

const connect = () => run(() => store.connectFriends())

function add() {
  const to = invite.value.trim()
  if (!to) return
  return run(async () => {
    await store.sendFriendRequest(to)
    invite.value = ''
  }, `Request sent to ${to.startsWith('@') ? to : `@${to}`}`)
}

const accept = (friend: PublicFriend) =>
  run(() => store.acceptFriendRequest(friend.friendshipId!), 'Friend added')

const decline = (friend: PublicFriend) => run(() => store.declineFriendRequest(friend.friendshipId!))

const remove = (friend: PublicFriend) => run(() => store.removeFriend(friend.address!), 'Friend removed')

const view = (handle: string) => store.openNimConnectProfile(handle)

const label = (friend: PublicFriend) =>
  friend.handle ? `@${friend.handle}` : friend.displayName
</script>

<template>
  <div class="stack">
    <p class="muted" v-if="connected">
      Your NimConnect friends. NimConnect does not share plaza presence, so everyone shows as a
      ghost rather than faking a live status.
    </p>
    <div class="connect" v-else>
      <p class="muted">
        Connect NimConnect to see and manage your friends — one wallet signature, no keys leave
        your wallet.
      </p>
      <button class="nw-btn nw-btn-primary" type="button" :disabled="busy" @click="connect">
        {{ busy ? 'Waiting for signature…' : 'Connect friends' }}
      </button>
    </div>

    <form v-if="connected" class="invite" @submit.prevent="add">
      <input
        v-model="invite"
        type="text"
        placeholder="@handle or NQ address"
        aria-label="Add a friend by handle or address"
        :disabled="busy"
      />
      <button class="nw-btn nw-btn-secondary" type="button" :disabled="busy || !invite.trim()" @click="add">
        Add
      </button>
    </form>

    <p v-if="error" class="msg error" role="alert">{{ error }}</p>
    <p v-else-if="notice" class="msg notice" role="status">{{ notice }}</p>

    <section v-if="incoming.length">
      <h3 class="display">Friend requests</h3>
      <ul>
        <li v-for="friend in incoming" :key="friend.friendshipId">
          <img v-if="friend.avatarDataUrl" :src="friend.avatarDataUrl" alt="" class="avatar" />
          <div class="who">
            <p class="display">{{ label(friend) }}</p>
            <p class="muted">{{ friend.statusLabel }}</p>
          </div>
          <div class="actions">
            <button class="nw-btn nw-btn-primary" type="button" :disabled="busy" @click="accept(friend)">
              Accept
            </button>
            <button class="nw-btn nw-btn-ghost" type="button" :disabled="busy" @click="decline(friend)">
              Decline
            </button>
          </div>
        </li>
      </ul>
    </section>

    <section>
      <h3 class="display">Friends<span v-if="connected" class="count"> · {{ friends.length }}</span></h3>
      <p v-if="connected && !friends.length" class="muted">
        No friends yet. Add someone by @handle above.
      </p>
      <ul>
        <li v-for="friend in friends" :key="friend.address ?? friend.handle">
          <img v-if="friend.avatarDataUrl" :src="friend.avatarDataUrl" alt="" class="avatar" />
          <div class="who">
            <p class="display">{{ label(friend) }}</p>
            <p class="muted">{{ friend.statusLabel }} · {{ friend.presence }}</p>
          </div>
          <div class="actions">
            <button
              class="nw-btn nw-btn-secondary"
              type="button"
              :disabled="!friend.handle"
              @click="view(friend.handle)"
            >
              Profile
            </button>
            <button
              v-if="friend.address"
              class="nw-btn nw-btn-ghost"
              type="button"
              :disabled="busy"
              @click="remove(friend)"
            >
              Remove
            </button>
          </div>
        </li>
      </ul>
    </section>

    <section v-if="outgoing.length">
      <h3 class="display">Sent</h3>
      <ul>
        <li v-for="friend in outgoing" :key="friend.friendshipId">
          <img v-if="friend.avatarDataUrl" :src="friend.avatarDataUrl" alt="" class="avatar" />
          <div class="who">
            <p class="display">{{ label(friend) }}</p>
            <p class="muted">{{ friend.statusLabel }}</p>
          </div>
          <div class="actions">
            <button class="nw-btn nw-btn-ghost" type="button" :disabled="busy" @click="decline(friend)">
              Cancel
            </button>
          </div>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.stack {
  display: grid;
  gap: 0.9rem;
}

.muted {
  color: var(--nw-muted);
  margin: 0;
  line-height: 1.45;
}

.connect {
  display: grid;
  gap: 0.6rem;
  justify-items: start;
}

.invite {
  display: flex;
  gap: 0.5rem;
}

.invite input {
  flex: 1;
  min-width: 0;
  border-radius: 14px;
  border: 1px solid var(--nw-panel-border);
  background: rgba(8, 12, 30, 0.6);
  color: var(--nw-text);
  padding: 0.7rem 0.9rem;
}

.invite input::placeholder {
  color: var(--nw-muted);
}

.invite input:focus-visible {
  outline: 2px solid var(--nw-cyan);
  outline-offset: 1px;
}

.msg {
  margin: 0;
  font-size: 0.88rem;
}

.error {
  color: var(--nw-pink);
}

.notice {
  color: var(--nw-green);
}

h3 {
  margin: 0 0 0.4rem;
  font-size: 0.95rem;
}

.count {
  color: var(--nw-muted);
  font-weight: 400;
}

ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.6rem;
}

li {
  display: flex;
  gap: 0.7rem;
  align-items: center;
  padding: 0.45rem 0;
  border-bottom: 1px solid var(--nw-panel-border);
}

.avatar {
  width: 2.4rem;
  height: 2.4rem;
  flex-shrink: 0;
}

.who {
  flex: 1;
  min-width: 0;
}

.who .display {
  margin: 0;
  font-size: 1rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.actions {
  display: flex;
  gap: 0.4rem;
  flex-shrink: 0;
}

.actions .nw-btn {
  padding: 0.45rem 0.7rem;
  font-size: 0.85rem;
}

.nw-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
