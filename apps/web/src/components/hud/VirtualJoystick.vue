<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { worldBridge } from '@/game/bridge/WorldBridge'

const root = ref<HTMLElement | null>(null)
const knob = ref<HTMLElement | null>(null)
const active = ref(false)
let pointerId: number | null = null

function setVector(x: number, y: number) {
  worldBridge.emitUi({ type: 'SET_INPUT_VECTOR', x, y })
}

function onPointerDown(event: PointerEvent) {
  if (!root.value) return
  active.value = true
  pointerId = event.pointerId
  root.value.setPointerCapture(event.pointerId)
  move(event)
}

function onPointerMove(event: PointerEvent) {
  if (!active.value || event.pointerId !== pointerId) return
  move(event)
}

function onPointerUp(event: PointerEvent) {
  if (event.pointerId !== pointerId) return
  active.value = false
  pointerId = null
  if (knob.value) {
    knob.value.style.transform = 'translate(-50%, -50%)'
  }
  setVector(0, 0)
}

function move(event: PointerEvent) {
  if (!root.value || !knob.value) return
  const rect = root.value.getBoundingClientRect()
  const cx = rect.left + rect.width / 2
  const cy = rect.top + rect.height / 2
  let dx = event.clientX - cx
  let dy = event.clientY - cy
  const max = rect.width / 2 - 18
  const len = Math.hypot(dx, dy) || 1
  if (len > max) {
    dx = (dx / len) * max
    dy = (dy / len) * max
  }
  knob.value.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`
  setVector(dx / max, dy / max)
}

onMounted(() => {
  root.value?.addEventListener('pointerdown', onPointerDown)
  root.value?.addEventListener('pointermove', onPointerMove)
  root.value?.addEventListener('pointerup', onPointerUp)
  root.value?.addEventListener('pointercancel', onPointerUp)
})

onBeforeUnmount(() => {
  setVector(0, 0)
})
</script>

<template>
  <div
    ref="root"
    class="joystick"
    :class="{ active }"
    aria-label="Movement joystick"
    role="application"
  >
    <div ref="knob" class="knob" />
  </div>
</template>

<style scoped>
.joystick {
  width: 118px;
  height: 118px;
  border-radius: 999px;
  border: 1px solid rgba(180, 200, 255, 0.22);
  background: rgba(10, 14, 34, 0.45);
  position: relative;
  touch-action: none;
  user-select: none;
}

.joystick.active {
  border-color: rgba(245, 166, 35, 0.55);
}

.knob {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 46px;
  height: 46px;
  border-radius: 999px;
  background: linear-gradient(145deg, var(--nw-cyan), var(--nw-purple));
  transform: translate(-50%, -50%);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.35);
}
</style>
