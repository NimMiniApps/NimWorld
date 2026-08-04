<script setup lang="ts">
import { ref } from 'vue'
import BootScreen from '@/components/BootScreen.vue'
import { isNimiqPayHost, loginWithHub, resolveSession } from '@/auth/session'

const emit = defineEmits<{ (e: 'authenticated', address: string): void }>()

const inPay = isNimiqPayHost()
const connecting = ref(false)
const error = ref<string | null>(null)

async function connect() {
  connecting.value = true
  error.value = null
  try {
    const address = await loginWithHub()
    emit('authenticated', address)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Login failed'
  } finally {
    connecting.value = false
  }
}

async function retryPay() {
  connecting.value = true
  error.value = null
  try {
    const session = await resolveSession()
    if (session.mode === 'embedded' || session.mode === 'authenticated') {
      emit('authenticated', session.address)
      return
    }
    error.value =
      'No wallet account is shared yet. Open NimWorld from Nimiq Pay with an unlocked wallet, then retry.'
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Could not reach Nimiq Pay'
  } finally {
    connecting.value = false
  }
}
</script>

<template>
  <BootScreen
    :status="
      connecting
        ? inPay
          ? 'Checking Nimiq Pay wallet…'
          : 'Opening Nimiq Hub…'
        : inPay
          ? 'Open NimWorld from your Nimiq Pay wallet to continue'
          : 'Connect your Nimiq account to enter'
    "
    :busy="connecting"
  >
    <button
      v-if="inPay"
      class="connect"
      type="button"
      :disabled="connecting"
      @click="retryPay"
    >
      {{ connecting ? 'Checking…' : 'Retry wallet share' }}
    </button>
    <button v-else class="connect" type="button" :disabled="connecting" @click="connect">
      {{ connecting ? 'Connecting…' : 'Connect with Nimiq Hub' }}
    </button>
    <p v-if="inPay && !error" class="hint">
      Hub popups are not available inside Nimiq Pay. Share a wallet account, then retry.
    </p>
    <p v-if="error" class="error">{{ error }}</p>
  </BootScreen>
</template>

<style scoped>
.connect {
  padding: 0.75rem 1.25rem;
  border-radius: 0.75rem;
  border: none;
  background: linear-gradient(135deg, var(--nw-gold), #ff8a3d);
  color: #1a1204;
  font-weight: 800;
  font-size: 0.95rem;
  cursor: pointer;
  box-shadow: 0 10px 28px rgba(245, 166, 35, 0.28);
  transition: transform 140ms ease, filter 140ms ease;
}

.connect:hover:not(:disabled) {
  filter: brightness(1.05);
}

.connect:active:not(:disabled) {
  transform: scale(0.98);
}

.connect:disabled {
  opacity: 0.7;
  cursor: default;
}

.hint {
  margin: 0.75rem 0 0;
  color: rgba(232, 240, 255, 0.72);
  font-size: 0.85rem;
  max-width: 22rem;
  line-height: 1.4;
}

.error {
  margin: 0.75rem 0 0;
  color: #ff8a8a;
  font-size: 0.85rem;
}
</style>
