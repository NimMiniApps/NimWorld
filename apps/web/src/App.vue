<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import GameCanvas from '@/components/GameCanvas.vue'
import BootScreen from '@/components/BootScreen.vue'
import LoginGate from '@/components/LoginGate.vue'
import ProfileChip from '@/components/hud/ProfileChip.vue'
import InteractionPrompt from '@/components/hud/InteractionPrompt.vue'
import VirtualJoystick from '@/components/hud/VirtualJoystick.vue'
import NearbyPlayers from '@/components/hud/NearbyPlayers.vue'
import LocationOverlay from '@/components/overlays/LocationOverlay.vue'
import PaymentSheet from '@/components/payments/PaymentSheet.vue'
import { usePlazaStore } from '@/stores/plazaStore'
import { resolveSession } from '@/auth/session'

const store = usePlazaStore()
const showMoveHint = ref(true)
const sessionResolved = ref(false)
const needsLogin = ref(false)
const gameReady = ref(false)

const bootStatus = computed(() => {
  if (!sessionResolved.value) return 'Connecting…'
  if (store.loading) return 'Opening the plaza…'
  if (!gameReady.value) return 'Loading the world…'
  return 'Ready'
})

const showBoot = computed(
  () => sessionResolved.value && !needsLogin.value && (!gameReady.value || store.loading) && !store.error,
)

onMounted(async () => {
  document.getElementById('boot-shell')?.remove()
  const session = await resolveSession()
  needsLogin.value = session.mode === 'anonymous'
  sessionResolved.value = true
})

function onAuthenticated() {
  needsLogin.value = false
  gameReady.value = false
}

function onGameReady() {
  gameReady.value = true
}

function onFirstMove() {
  showMoveHint.value = false
}
</script>

<template>
  <div class="shell">
    <GameCanvas
      v-if="sessionResolved && !needsLogin"
      @first-move="onFirstMove"
      @ready="onGameReady"
    />

    <BootScreen v-if="!sessionResolved" status="Connecting…" />

    <LoginGate v-else-if="needsLogin" @authenticated="onAuthenticated" />

    <BootScreen v-else-if="showBoot" :status="bootStatus" />

    <div v-else-if="store.error" class="error-shell">
      <BootScreen status="Could not start" :busy="false">
        <p class="error-detail">{{ store.error }}</p>
      </BootScreen>
    </div>

    <template v-else>
      <header class="top">
        <ProfileChip />
        <div class="brand">
          <p class="display title">NimWorld</p>
          <p class="tagline">Your identity. Your apps. Your plaza.</p>
        </div>
      </header>

      <div
        v-if="showMoveHint && !store.openLocationId"
        class="move-hint nw-panel"
        aria-live="polite"
      >
        Move with the stick or WASD
      </div>

      <NearbyPlayers />

      <div class="center-prompt">
        <InteractionPrompt />
      </div>

      <div v-if="store.celebration" class="toast nw-panel">{{ store.celebration }}</div>

      <footer class="bottom">
        <VirtualJoystick />
        <p class="hint" :class="{ faded: !showMoveHint }">Enter / tap prompt to interact</p>
      </footer>
    </template>

    <LocationOverlay />
    <PaymentSheet />
  </div>
</template>

<style scoped>
.shell {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #0a0f24;
}

.top {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 20;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  padding: calc(0.65rem + env(safe-area-inset-top)) 0.75rem 0;
  pointer-events: none;
}

.top :deep(.chip) {
  pointer-events: auto;
}

.brand {
  text-align: right;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.55);
}

.title {
  margin: 0;
  font-size: clamp(1.15rem, 3.6vw, 1.55rem);
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--nw-gold);
}

.tagline {
  margin: 0.15rem 0 0;
  color: var(--nw-muted);
  font-size: 0.72rem;
}

.move-hint {
  position: absolute;
  left: 50%;
  top: calc(5.2rem + env(safe-area-inset-top));
  transform: translateX(-50%);
  z-index: 21;
  padding: 0.55rem 0.9rem;
  font-size: 0.85rem;
  color: var(--nw-text);
  animation: hint-in 420ms ease both;
  pointer-events: none;
}

.center-prompt {
  position: absolute;
  left: 50%;
  bottom: calc(8.2rem + env(safe-area-inset-bottom));
  transform: translateX(-50%);
  z-index: 22;
}

.bottom {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 22;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  padding: 0 0.75rem calc(0.7rem + env(safe-area-inset-bottom));
  pointer-events: none;
}

.bottom :deep(.joystick) {
  pointer-events: auto;
}

.hint {
  margin: 0 0 0.35rem;
  color: rgba(214, 222, 255, 0.75);
  font-size: 0.72rem;
  text-shadow: 0 1px 8px rgba(0, 0, 0, 0.6);
  transition: opacity 500ms ease;
}

.hint.faded {
  opacity: 0.35;
}

.error-detail {
  margin: 0;
  color: #ff8a8a;
  font-size: 0.9rem;
}

.toast {
  position: absolute;
  top: calc(5.5rem + env(safe-area-inset-top));
  left: 50%;
  transform: translateX(-50%);
  z-index: 25;
  padding: 0.7rem 1rem;
  color: var(--nw-gold);
  animation: pop 320ms ease both;
}

@keyframes pop {
  from {
    opacity: 0;
    transform: translate(-50%, -8px);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}

@keyframes hint-in {
  from {
    opacity: 0;
    transform: translate(-50%, -6px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%);
  }
}

@media (min-width: 900px) {
  .bottom :deep(.joystick) {
    opacity: 0.4;
  }
}
</style>
