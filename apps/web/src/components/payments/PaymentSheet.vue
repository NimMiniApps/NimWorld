<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { usePlazaStore } from '@/stores/plazaStore'

const store = usePlazaStore()
const presets = [1, 5, 10] as const
const amountNim = ref(1)
const customNim = ref('')
const message = ref('')
const usingCustom = ref(false)

const open = computed(() => Boolean(store.paymentSheet?.open))
const mode = computed(() => store.paymentSheet?.mode ?? 'tip')
const title = computed(() => {
  switch (mode.value) {
    case 'tip':
      return 'Tip NimWorld'
    case 'send':
      return `Send to ${store.paymentSheet?.recipientLabel ?? 'friend'}`
    case 'request':
      return store.paymentSheet?.recipientLabel
        ? `Request from ${store.paymentSheet.recipientLabel}`
        : 'Request NIM'
  }
})

watch(
  () => store.paymentSheet,
  (sheet) => {
    if (!sheet?.open) return
    amountNim.value = 1
    customNim.value = ''
    message.value = ''
    usingCustom.value = false
  },
)

function pickPreset(nim: number) {
  usingCustom.value = false
  amountNim.value = nim
  customNim.value = ''
}

function onCustomInput(value: string) {
  customNim.value = value
  usingCustom.value = true
  const parsed = Number(value)
  if (Number.isFinite(parsed)) amountNim.value = parsed
}

const canSubmit = computed(() => {
  if (store.paymentBusy) return false
  const nim = usingCustom.value ? Number(customNim.value) : amountNim.value
  return Number.isFinite(nim) && nim > 0 && nim <= 10_000
})

async function submit() {
  const nim = usingCustom.value ? Number(customNim.value) : amountNim.value
  await store.submitPayment(nim, message.value)
}
</script>

<template>
  <div v-if="open" class="backdrop" @click.self="store.closePaymentSheet()">
    <section class="nw-panel sheet" role="dialog" :aria-label="title">
      <header>
        <div>
          <p class="eyebrow">Payments</p>
          <h2 class="display">{{ title }}</h2>
          <p v-if="mode !== 'request'" class="recipient">
            {{ store.paymentSheet?.recipientLabel }}
          </p>
        </div>
        <button class="nw-btn nw-btn-ghost" type="button" :disabled="store.paymentBusy" @click="store.closePaymentSheet()">
          Close
        </button>
      </header>

      <div class="presets">
        <button
          v-for="nim in presets"
          :key="nim"
          class="nw-btn"
          :class="!usingCustom && amountNim === nim ? 'nw-btn-primary' : 'nw-btn-secondary'"
          type="button"
          :disabled="store.paymentBusy"
          @click="pickPreset(nim)"
        >
          {{ nim }} NIM
        </button>
      </div>

      <label class="field">
        <span>Custom amount (NIM)</span>
        <input
          :value="customNim"
          type="number"
          min="0.01"
          max="10000"
          step="0.01"
          placeholder="e.g. 2.5"
          :disabled="store.paymentBusy"
          @input="onCustomInput(($event.target as HTMLInputElement).value)"
        />
      </label>

      <label class="field">
        <span>Message (optional)</span>
        <input
          v-model="message"
          type="text"
          maxlength="64"
          placeholder="Thanks!"
          :disabled="store.paymentBusy"
        />
      </label>

      <button
        class="nw-btn nw-btn-primary submit"
        type="button"
        :disabled="!canSubmit"
        @click="submit"
      >
        {{ store.paymentBusy ? 'Working…' : mode === 'request' ? 'Create request link' : 'Send NIM' }}
      </button>
    </section>
  </div>
</template>

<style scoped>
.backdrop {
  position: absolute;
  inset: 0;
  z-index: 50;
  background: rgba(5, 8, 20, 0.55);
  display: grid;
  place-items: end center;
  padding: 0.75rem;
  padding-bottom: calc(0.75rem + env(safe-area-inset-bottom));
}

.sheet {
  width: min(420px, 100%);
  padding: 1rem 1.1rem 1.2rem;
  display: grid;
  gap: 0.85rem;
}

header {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  align-items: start;
}

.eyebrow {
  margin: 0;
  font-size: 0.72rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--nw-muted);
}

h2 {
  margin: 0.15rem 0 0;
  font-size: 1.15rem;
}

.recipient {
  margin: 0.25rem 0 0;
  color: var(--nw-muted);
  font-size: 0.85rem;
}

.presets {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.field {
  display: grid;
  gap: 0.35rem;
  font-size: 0.82rem;
  color: var(--nw-muted);
}

.field input {
  border-radius: 0.65rem;
  border: 1px solid var(--nw-panel-border);
  background: rgba(8, 12, 28, 0.85);
  color: var(--nw-text);
  padding: 0.65rem 0.75rem;
  font: inherit;
}

.submit {
  width: 100%;
}
</style>
