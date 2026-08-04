<script setup lang="ts">
import { computed } from 'vue'
import { usePlazaStore } from '@/stores/plazaStore'
import { formatNim, HUD_ICON, PREVIEW_NIM_BALANCE } from './hudPreviewData'

const store = usePlazaStore()
const amount = computed(() => store.balanceNim ?? PREVIEW_NIM_BALANCE)
</script>

<template>
  <div class="balance-row">
    <div
      class="nw-panel balance"
      :title="store.balanceIsPreview ? 'Preview balance — not a live wallet read' : 'NIM balance'"
    >
      <img class="coin" :src="HUD_ICON.coin" alt="" />
      <span class="amount">{{ formatNim(amount) }} NIM</span>
      <span v-if="store.balanceIsPreview" class="nw-hud-badge">Preview</span>
    </div>
    <button class="nw-icon-btn" type="button" disabled aria-label="Mail (coming soon)">✉</button>
    <button class="nw-icon-btn" type="button" disabled aria-label="Settings (coming soon)">⚙</button>
  </div>
</template>

<style scoped>
.balance-row {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  pointer-events: auto;
}

.balance {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.45rem 0.7rem;
  border-color: rgba(245, 166, 35, 0.4);
  box-shadow:
    0 12px 40px rgba(0, 0, 0, 0.35),
    0 0 12px rgba(245, 166, 35, 0.12);
}

.coin {
  width: 1.1rem;
  height: 1.1rem;
  object-fit: contain;
  image-rendering: pixelated;
}

.amount {
  font-family: var(--nw-font-pixel);
  font-size: 0.52rem;
  letter-spacing: 0.02em;
  color: var(--nw-text);
  white-space: nowrap;
}
</style>
