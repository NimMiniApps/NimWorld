<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { identiconDataUrl } from '@/lib/identicon'

const props = withDefaults(
  defineProps<{
    address?: string | null
    fallback?: string
    size?: string
  }>(),
  {
    address: null,
    fallback: '?',
    size: '2.35rem',
  },
)

const src = ref<string | null>(null)

async function load() {
  src.value = null
  if (!props.address) return
  try {
    src.value = await identiconDataUrl(props.address)
  } catch {
    src.value = null
  }
}

onMounted(load)
watch(() => props.address, load)
</script>

<template>
  <div class="identicon" :style="{ width: size, height: size }" aria-hidden="true">
    <img v-if="src" :src="src" alt="" />
    <span v-else>{{ fallback.slice(0, 1).toUpperCase() }}</span>
  </div>
</template>

<style scoped>
.identicon {
  border-radius: 10px;
  background: linear-gradient(145deg, var(--nw-gold), #ff8a3d);
  display: grid;
  place-items: center;
  font-family: var(--nw-font-display);
  font-weight: 800;
  color: #1a1204;
  overflow: hidden;
  border: 1px solid rgba(245, 166, 35, 0.45);
  flex-shrink: 0;
}

.identicon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
</style>
