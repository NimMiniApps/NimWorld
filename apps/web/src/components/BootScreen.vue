<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    status: string
    /** Show indeterminate progress + tip after delay */
    busy?: boolean
  }>(),
  { busy: true },
)

const buildId = __BUILD_ID__
const tipVisible = ref(false)
let tipTimer: number | undefined

onMounted(() => {
  if (!props.busy) return
  tipTimer = window.setTimeout(() => {
    tipVisible.value = true
  }, 2500)
})

onUnmounted(() => {
  if (tipTimer !== undefined) window.clearTimeout(tipTimer)
})
</script>

<template>
  <div class="boot" role="status" aria-live="polite" aria-busy="true">
    <div class="art" aria-hidden="true" />
    <div class="scrim" aria-hidden="true" />
    <div class="glow" aria-hidden="true" />

    <div class="content">
      <div class="plate">
        <p class="brand">NIMWORLD</p>
        <p class="tagline">Your identity. Your apps. Your plaza.</p>
      </div>

      <div class="panel">
        <p class="status">{{ status }}</p>

        <div v-if="busy" class="track" aria-hidden="true">
          <div class="bar" />
        </div>

        <p v-if="busy && tipVisible" class="tip">First visit can take a moment</p>

        <div v-if="$slots.default" class="actions">
          <slot />
        </div>
      </div>
    </div>

    <p class="build">build {{ buildId }}</p>
  </div>
</template>

<style scoped>
.boot {
  position: absolute;
  inset: 0;
  z-index: 40;
  display: grid;
  place-items: center;
  overflow: hidden;
  background: #070b1a;
  color: var(--nw-text);
  animation: boot-in 420ms ease both;
}

.art {
  position: absolute;
  inset: 0;
  background: url('/assets/art/ui/boot_keyart_v01_final.png') center / cover no-repeat, #070b1a;
  image-rendering: pixelated;
  animation: drift 24s ease-in-out infinite alternate;
}

/* Darken + vignette so panel text stays readable over the key art. */
.scrim {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(120% 90% at 50% 42%, transparent 0%, rgba(7, 11, 26, 0.55) 62%, rgba(7, 11, 26, 0.92) 100%),
    linear-gradient(180deg, rgba(7, 11, 26, 0.62), rgba(7, 11, 26, 0.35) 40%, rgba(7, 11, 26, 0.85));
}

.glow {
  position: absolute;
  left: 50%;
  top: 44%;
  width: min(26rem, 76vw);
  height: min(26rem, 76vw);
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: radial-gradient(circle, rgba(245, 166, 35, 0.22) 0%, rgba(88, 196, 255, 0.08) 40%, transparent 70%);
  animation: pulse-glow 2.8s ease-in-out infinite;
}

.content {
  position: relative;
  z-index: 1;
  width: min(23rem, calc(100vw - 2rem));
  display: grid;
  gap: 1.1rem;
  text-align: center;
}

/* Chunky HUD plate: hard bevelled corners, bright inner rim, deep drop. */
.plate,
.panel {
  clip-path: polygon(
    8px 0,
    calc(100% - 8px) 0,
    100% 8px,
    100% calc(100% - 8px),
    calc(100% - 8px) 100%,
    8px 100%,
    0 calc(100% - 8px),
    0 8px
  );
  background: rgba(12, 18, 42, 0.94);
  border: 3px solid #5b6ea8;
  box-shadow: inset 0 0 0 2px #0a0f24, 0 6px 0 rgba(4, 7, 18, 0.55);
  padding: 1rem 1.1rem;
  animation: rise 560ms ease both;
}

.panel {
  animation-delay: 120ms;
}

.brand {
  margin: 0;
  font-family: var(--nw-font-pixel);
  font-size: clamp(1.05rem, 5.2vw, 1.6rem);
  line-height: 1.35;
  color: var(--nw-gold);
  text-shadow: 0 3px 0 #3a2404, 0 0 18px rgba(245, 166, 35, 0.45);
}

.tagline {
  margin: 0.65rem 0 0;
  color: var(--nw-muted);
  font-size: 0.85rem;
}

.status {
  margin: 0;
  min-height: 1.25rem;
  /* ponytail: body font here, not the pixel face — status strings are long and must stay readable */
  font-size: 0.92rem;
  font-weight: 700;
  line-height: 1.45;
  color: rgba(244, 246, 255, 0.92);
}

.track {
  margin: 0.95rem auto 0;
  width: min(14rem, 88%);
  height: 10px;
  overflow: hidden;
  background: #0a0f24;
  border: 2px solid #3b4a78;
}

.bar {
  width: 42%;
  height: 100%;
  background: repeating-linear-gradient(
    90deg,
    var(--nw-gold) 0 4px,
    #ff8a3d 4px 8px
  );
  /* Promote to its own layer at mount: world-gen blocks the main thread, and only a
     compositor-driven transform keeps moving through it. */
  will-change: transform;
  animation: slide 1.6s steps(14, end) infinite;
}

.build {
  position: absolute;
  right: 0.7rem;
  bottom: calc(0.5rem + env(safe-area-inset-bottom));
  margin: 0;
  z-index: 1;
  font-size: 0.62rem;
  letter-spacing: 0.04em;
  color: rgba(168, 179, 217, 0.55);
}

.tip {
  margin: 0.8rem 0 0;
  color: rgba(168, 179, 217, 0.85);
  font-size: 0.75rem;
}

.actions {
  margin-top: 1.1rem;
}

@keyframes boot-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes drift {
  from {
    transform: scale(1.06) translateY(-1%);
  }
  to {
    transform: scale(1.12) translateY(1%);
  }
}

@keyframes pulse-glow {
  0%,
  100% {
    opacity: 0.75;
    transform: translate(-50%, -50%) scale(0.96);
  }
  50% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.04);
  }
}

/* ponytail: stepped keyframes so the bar reads as pixel movement, not a smooth slide */
@keyframes slide {
  0% {
    transform: translateX(-40%);
  }
  50% {
    transform: translateX(140%);
  }
  100% {
    transform: translateX(-40%);
  }
}

@keyframes fade-pulse {
  0%,
  100% {
    opacity: 0.3;
  }
  50% {
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .boot,
  .art,
  .glow,
  .plate,
  .panel {
    animation: none !important;
  }

  .art {
    transform: scale(1.06);
  }

  /* ponytail: fade, not travel — a parked bar reads as "stuck", and reduced motion
     objects to movement, not to a slow opacity pulse. */
  .bar {
    width: 100%;
    transform: none;
    animation: fade-pulse 1.8s ease-in-out infinite;
  }
}
</style>
