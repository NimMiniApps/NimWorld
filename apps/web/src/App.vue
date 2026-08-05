<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import GameCanvas from '@/components/GameCanvas.vue'
import BootScreen from '@/components/BootScreen.vue'
import LoginGate from '@/components/LoginGate.vue'
import ProfileChip from '@/components/hud/ProfileChip.vue'
import BalanceChip from '@/components/hud/BalanceChip.vue'
import BottomNav from '@/components/hud/BottomNav.vue'
import ChatShell from '@/components/hud/ChatShell.vue'
import FriendsShell from '@/components/hud/FriendsShell.vue'
import EventsShell from '@/components/hud/EventsShell.vue'
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
  if (store.friendsBusy) return 'Connecting friends — approve the signature'
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

    <LoginGate v-if="sessionResolved && needsLogin" @authenticated="onAuthenticated" />

    <!-- One instance across every loading phase: a remount would restart the progress bar. -->
    <BootScreen v-else-if="!sessionResolved || showBoot" :status="bootStatus" />

    <div v-else-if="store.error" class="error-shell">
      <BootScreen status="Could not start" :busy="false">
        <p class="error-detail">{{ store.error }}</p>
      </BootScreen>
    </div>

    <template v-else>
      <header class="top">
        <div class="top-left">
          <ProfileChip />
        </div>
        <div class="brand">
          <p class="display title">NIMCONNECT PLAZA</p>
          <p class="tagline">Your identity. Your apps. Your world.</p>
        </div>
        <div class="top-right">
          <BalanceChip />
          <div class="right-rail">
            <FriendsShell />
            <NearbyPlayers />
          </div>
        </div>
      </header>

      <div
        v-if="showMoveHint && !store.openLocationId"
        class="move-hint nw-panel"
        aria-live="polite"
      >
        Move with the stick or WASD
      </div>

      <div class="center-prompt">
        <InteractionPrompt />
      </div>

      <div v-if="store.celebration" class="toast nw-panel">{{ store.celebration }}</div>

      <div class="bottom-left">
        <ChatShell />
        <VirtualJoystick />
      </div>

      <footer class="bottom">
        <BottomNav />
        <p class="hint" :class="{ faded: !showMoveHint }">Walk up to a landmark to enter</p>
      </footer>

      <div class="bottom-right">
        <EventsShell />
      </div>
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
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: flex-start;
  gap: 0.75rem;
  padding: calc(0.65rem + env(safe-area-inset-top)) 0.75rem 0;
  pointer-events: none;
}

.top-left,
.top-right {
  pointer-events: auto;
}

/* Without this the 1fr column stretches the profile chip across half the screen. */
.top-left {
  justify-self: start;
  width: max-content;
  max-width: 100%;
}

/* Balance chip and rail share the right column so nothing can overlap the profile. */
.top-right {
  justify-self: end;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.55rem;
  width: min(15.5rem, 44vw);
}

.brand {
  text-align: center;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.55);
  padding-top: 0.15rem;
}

.title {
  margin: 0;
  font-family: var(--nw-font-pixel);
  font-size: clamp(0.55rem, 1.6vw, 0.72rem);
  font-weight: 400;
  letter-spacing: 0.04em;
  color: var(--nw-gold);
  text-shadow:
    0 0 12px rgba(245, 166, 35, 0.35),
    0 2px 12px rgba(0, 0, 0, 0.55);
}

.tagline {
  margin: 0.35rem 0 0;
  color: var(--nw-muted);
  font-size: 0.72rem;
}

.right-rail {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.55rem;
  width: 100%;
  pointer-events: none;
}

.right-rail :deep(.shell),
.right-rail :deep(.nearby) {
  pointer-events: auto;
  position: static;
  width: 100%;
  top: auto;
  right: auto;
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
  bottom: calc(8.8rem + env(safe-area-inset-bottom));
  transform: translateX(-50%);
  z-index: 22;
}

.bottom-left {
  position: absolute;
  left: 0.75rem;
  bottom: calc(0.7rem + env(safe-area-inset-bottom));
  z-index: 22;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.55rem;
  pointer-events: none;
}

.bottom-left :deep(.shell),
.bottom-left :deep(.joystick) {
  pointer-events: auto;
}

.bottom-right {
  position: absolute;
  right: 0.75rem;
  bottom: calc(5.8rem + env(safe-area-inset-bottom));
  z-index: 22;
  pointer-events: none;
}

.bottom-right :deep(.shell) {
  pointer-events: auto;
}

.bottom {
  position: absolute;
  left: 50%;
  bottom: calc(0.7rem + env(safe-area-inset-bottom));
  transform: translateX(-50%);
  z-index: 23;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  pointer-events: none;
}

.bottom :deep(.bottom-nav) {
  pointer-events: auto;
}

.hint {
  margin: 0;
  color: rgba(214, 222, 255, 0.75);
  font-size: 0.72rem;
  text-shadow: 0 1px 8px rgba(0, 0, 0, 0.6);
  transition: opacity 500ms ease;
  order: -1;
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

@media (max-width: 899px) {
  .top {
    grid-template-columns: minmax(0, 1fr) auto;
  }

  /* Phone top strip: chip fills the free column, right column shrinks to content. */
  .top-left {
    width: auto;
  }

  .top-left :deep(.chip) {
    min-width: 0;
  }

  .top-right {
    width: auto;
  }

  /* Disabled placeholders — not worth the width on a phone. */
  .top-right :deep(.nw-icon-btn) {
    display: none;
  }

  .right-rail {
    align-items: flex-end;
  }

  /* Collapsed: pill-sized. Expanded: capped so it can't squeeze the profile chip. */
  .right-rail :deep(.nearby) {
    width: auto;
    max-width: min(15.5rem, 56vw);
  }

  .move-hint {
    top: auto;
    bottom: calc(7.5rem + env(safe-area-inset-bottom));
  }

  .brand {
    display: none;
  }

  .top-right {
    grid-column: 2;
  }

  .hint {
    display: none;
  }
}

@media (min-width: 900px) {
  .bottom-left :deep(.joystick) {
    opacity: 0.4;
  }
}
</style>
