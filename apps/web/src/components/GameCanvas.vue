<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type Phaser from 'phaser'
import { createAdapters } from '@/adapters/createAdapters'
import { loadPlazaPosition } from '@/adapters/launcher/AppLauncher'
import { createPlazaGame } from '@/game/createGame'
import { worldBridge } from '@/game/bridge/WorldBridge'
import { usePlazaStore } from '@/stores/plazaStore'

const emit = defineEmits<{
  firstMove: []
  ready: []
}>()

const host = ref<HTMLElement | null>(null)
const store = usePlazaStore()
let game: Phaser.Game | null = null
let offFirstMove: (() => void) | null = null
let pendingReturnAppId: string | null = null
let spawnAtCreate: { x: number; y: number } | null = null

const adapters = createAdapters()
store.setAdapters(adapters)

function stripReturnedFromQuery() {
  const url = new URL(window.location.href)
  if (!url.searchParams.has('returnedFrom')) return
  url.searchParams.delete('returnedFrom')
  const search = url.searchParams.toString()
  window.history.replaceState({}, '', `${url.pathname}${search ? `?${search}` : ''}${url.hash}`)
}

onMounted(async () => {
  await store.bootstrap()
  if (!host.value) return

  const params = new URLSearchParams(window.location.search)
  pendingReturnAppId = params.get('returnedFrom')
  if (pendingReturnAppId) stripReturnedFromQuery()

  // Subscribe before Phaser boots so PLAYER_READY is never missed.
  worldBridge.onWorld((event) => {
    switch (event.type) {
      case 'INTERACTION_AVAILABLE':
        store.setInteraction(event.target)
        break
      case 'INTERACTION_CLEARED':
        store.setInteraction(null)
        break
      case 'OPEN_LOCATION':
        worldBridge.emitUi({ type: 'PAUSE_MOVEMENT' })
        void store.openLocation(event.locationId)
        break
      case 'PLAYER_MOVED':
        store.rememberPosition(event.position)
        break
      case 'PLAYER_READY':
        store.rememberPosition(event.position)
        if (pendingReturnAppId) {
          const appId = pendingReturnAppId
          pendingReturnAppId = null
          void store.refreshAfterReturn(appId)
          if (!spawnAtCreate) {
            const saved = loadPlazaPosition()
            if (saved) worldBridge.emitUi({ type: 'RESTORE_POSITION', position: saved })
          }
        }
        emit('ready')
        break
      case 'RETURNED_FROM_APP':
        void store.refreshAfterReturn(event.appId)
        break
    }
  })

  const actors = await adapters.presence.getActors()
  const label = store.profile?.handle ? `@${store.profile.handle}` : '@guest'
  spawnAtCreate = store.lastPosition

  game = createPlazaGame(host.value, {
    bridge: worldBridge,
    actors,
    spawn: spawnAtCreate,
    playerLabel: label,
  })

  const onFirst = () => emit('firstMove')
  game.events.on('plaza-first-move', onFirst)
  offFirstMove = () => game?.events.off('plaza-first-move', onFirst)
})

watch(
  () => store.openLocationId,
  (id) => {
    if (!id) worldBridge.emitUi({ type: 'RESUME_MOVEMENT' })
  },
)

onBeforeUnmount(() => {
  offFirstMove?.()
  game?.destroy(true)
  game = null
})

defineExpose({ adapters })
</script>

<template>
  <div ref="host" class="game-host" aria-label="NimWorld plaza" />
</template>

<style scoped>
.game-host {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  min-height: 100%;
  background: #0a0f24;
}

.game-host :deep(canvas) {
  position: absolute !important;
  inset: 0 !important;
  width: 100% !important;
  height: 100% !important;
  display: block;
  image-rendering: pixelated;
}
</style>
