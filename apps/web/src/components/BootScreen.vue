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
    <div class="sky" aria-hidden="true" />
    <div class="glow" aria-hidden="true" />
    <div class="stars" aria-hidden="true" />
    <div class="crystal" aria-hidden="true">
      <span class="facet a" />
      <span class="facet b" />
      <span class="core" />
    </div>

    <div class="content">
      <p class="brand">NimWorld</p>
      <p class="tagline">Your identity. Your apps. Your plaza.</p>

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

.sky {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(900px 520px at 50% 18%, rgba(88, 196, 255, 0.16), transparent 58%),
    radial-gradient(700px 480px at 50% 72%, rgba(155, 123, 255, 0.14), transparent 55%),
    radial-gradient(1200px 800px at 50% 100%, #121a3a 0%, #070b1a 62%);
}

.glow {
  position: absolute;
  left: 50%;
  top: 42%;
  width: min(28rem, 78vw);
  height: min(28rem, 78vw);
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: radial-gradient(circle, rgba(245, 166, 35, 0.18) 0%, rgba(88, 196, 255, 0.08) 38%, transparent 68%);
  filter: blur(4px);
  animation: pulse-glow 2.8s ease-in-out infinite;
}

.stars {
  position: absolute;
  inset: 0;
  opacity: 0.55;
  background-image:
    radial-gradient(1.5px 1.5px at 12% 22%, rgba(255, 255, 255, 0.55), transparent),
    radial-gradient(1px 1px at 28% 68%, rgba(255, 255, 255, 0.4), transparent),
    radial-gradient(1.5px 1.5px at 63% 18%, rgba(255, 255, 255, 0.5), transparent),
    radial-gradient(1px 1px at 78% 42%, rgba(255, 255, 255, 0.35), transparent),
    radial-gradient(1.5px 1.5px at 88% 76%, rgba(255, 255, 255, 0.45), transparent),
    radial-gradient(1px 1px at 41% 36%, rgba(255, 255, 255, 0.35), transparent);
  animation: twinkle 4.5s ease-in-out infinite;
}

.crystal {
  position: absolute;
  left: 50%;
  top: 34%;
  width: 3.4rem;
  height: 4.6rem;
  transform: translate(-50%, -50%);
  filter: drop-shadow(0 0 18px rgba(88, 196, 255, 0.45));
}

.facet {
  position: absolute;
  inset: 0;
  clip-path: polygon(50% 0%, 92% 34%, 72% 100%, 28% 100%, 8% 34%);
}

.facet.a {
  background: linear-gradient(160deg, rgba(245, 166, 35, 0.95), rgba(155, 123, 255, 0.75) 55%, rgba(88, 196, 255, 0.55));
  animation: crystal-breathe 2.4s ease-in-out infinite;
}

.facet.b {
  inset: 12% 18% 10%;
  background: linear-gradient(200deg, rgba(255, 255, 255, 0.55), transparent 60%);
  mix-blend-mode: soft-light;
}

.core {
  position: absolute;
  left: 50%;
  top: 48%;
  width: 0.7rem;
  height: 0.7rem;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  background: #fff8e8;
  box-shadow: 0 0 16px 6px rgba(245, 166, 35, 0.55);
  animation: core-pulse 1.8s ease-in-out infinite;
}

.content {
  position: relative;
  z-index: 1;
  width: min(22rem, calc(100vw - 2.5rem));
  margin-top: 7.5rem;
  text-align: center;
}

.brand {
  margin: 0;
  font-family: var(--nw-font-display);
  font-size: clamp(2rem, 7vw, 2.75rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--nw-gold);
  text-shadow: 0 2px 24px rgba(245, 166, 35, 0.35);
  animation: rise 560ms ease both;
}

.tagline {
  margin: 0.4rem 0 0;
  color: var(--nw-muted);
  font-size: 0.92rem;
  animation: rise 560ms ease both 80ms;
}

.status {
  margin: 1.55rem 0 0;
  min-height: 1.25rem;
  color: rgba(244, 246, 255, 0.9);
  font-size: 0.95rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  animation: rise 560ms ease both 140ms;
}

.track {
  margin: 1rem auto 0;
  width: min(14rem, 70%);
  height: 3px;
  border-radius: 999px;
  overflow: hidden;
  background: rgba(180, 200, 255, 0.12);
  animation: rise 560ms ease both 180ms;
}

.bar {
  width: 42%;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--nw-cyan), var(--nw-gold), var(--nw-purple));
  background-size: 200% 100%;
  animation: slide 1.35s ease-in-out infinite, shimmer 1.8s linear infinite;
}

.tip {
  margin: 0.85rem 0 0;
  color: rgba(168, 179, 217, 0.85);
  font-size: 0.78rem;
  animation: rise 400ms ease both;
}

.actions {
  margin-top: 1.35rem;
  animation: rise 560ms ease both 200ms;
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

@keyframes crystal-breathe {
  0%,
  100% {
    filter: brightness(1);
    transform: scale(1);
  }
  50% {
    filter: brightness(1.12);
    transform: scale(1.03);
  }
}

@keyframes core-pulse {
  0%,
  100% {
    opacity: 0.85;
    transform: translate(-50%, -50%) scale(0.92);
  }
  50% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.08);
  }
}

@keyframes twinkle {
  0%,
  100% {
    opacity: 0.4;
  }
  50% {
    opacity: 0.7;
  }
}

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

@keyframes shimmer {
  from {
    background-position: 0% 50%;
  }
  to {
    background-position: 200% 50%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .boot,
  .glow,
  .stars,
  .facet.a,
  .core,
  .bar,
  .brand,
  .tagline,
  .status,
  .track,
  .tip,
  .actions {
    animation: none !important;
  }

  .bar {
    width: 55%;
    transform: none;
    margin: 0 auto;
  }
}
</style>
