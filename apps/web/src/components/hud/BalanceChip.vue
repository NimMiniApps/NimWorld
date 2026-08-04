<script setup lang="ts">
import { PREVIEW_NIM_BALANCE } from './hudPreviewData'
</script>

<template>
  <div class="balance-row">
    <div class="nw-panel balance" title="Preview balance — not a live wallet read">
      <span class="coin" aria-hidden="true">◆</span>
      <span class="amount">{{ PREVIEW_NIM_BALANCE }} NIM</span>
      <span class="nw-hud-badge">Preview</span>
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
  color: var(--nw-gold);
  font-size: 0.75rem;
  text-shadow: 0 0 8px rgba(245, 166, 35, 0.55);
}

.amount {
  font-family: var(--nw-font-pixel);
  font-size: 0.52rem;
  letter-spacing: 0.02em;
  color: var(--nw-text);
  white-space: nowrap;
}
</style>
