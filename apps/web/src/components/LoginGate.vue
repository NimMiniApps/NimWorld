<script setup lang="ts">
import { ref } from 'vue'
import { loginWithHub } from '@/auth/session'

const emit = defineEmits<{ (e: 'authenticated', address: string): void }>()

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
</script>

<template>
  <div class="boot nw-panel">
    <p class="display">NimWorld</p>
    <p>Connect your Nimiq account to enter the plaza.</p>
    <button class="connect" :disabled="connecting" @click="connect">
      {{ connecting ? 'Connecting…' : 'Connect with Nimiq Hub' }}
    </button>
    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<style scoped>
.boot {
  position: absolute;
  z-index: 30;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  padding: 1.25rem 1.4rem;
  min-width: 16rem;
  text-align: center;
}

.boot .display {
  margin: 0 0 0.35rem;
  font-size: 1.4rem;
  color: var(--nw-gold);
}

.connect {
  margin-top: 0.9rem;
  padding: 0.6rem 1.1rem;
  border-radius: 0.6rem;
  border: none;
  background: var(--nw-gold);
  color: #14171f;
  font-weight: 700;
  cursor: pointer;
}

.connect:disabled {
  opacity: 0.6;
  cursor: default;
}

.error {
  margin-top: 0.6rem;
  color: #ff8a8a;
  font-size: 0.85rem;
}
</style>
