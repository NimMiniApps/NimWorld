<script setup lang="ts">
import { ref } from 'vue'
import BootScreen from '@/components/BootScreen.vue'
import { isNimiqPayHost, loginWithHub, resolveSession } from '@/auth/session'

const emit = defineEmits<{ (e: 'authenticated', address: string): void }>()

const SOCIALS = [
  {
    label: 'Telegram',
    href: 'https://t.me/+8I82PvjMg7w3NWI0',
    icon: 'M9.036 15.803l-.36 5.06c.515 0 .738-.221 1.005-.487l2.414-2.31 5.003 3.665c.918.512 1.567.243 1.815-.848l3.29-15.42c.291-1.36-.492-1.892-1.386-1.56L1.36 9.72c-1.33.516-1.31 1.257-.226 1.591l4.94 1.54 11.47-7.223c.54-.357 1.03-.16.626.198L9.036 15.803z',
  },
  {
    label: 'X',
    href: 'https://x.com/nimiqminiapps',
    icon: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.451-6.231zm-1.161 17.52h1.833L7.084 4.126H5.117l11.966 15.644z',
  },
]

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

    <p class="about">
      A walkable pixel plaza for the Nimiq ecosystem. Bring your Nimiq address, meet other
      players in real time, and step into Mini Apps — arcade, arena, market — straight from
      the map.
    </p>

    <div class="socials">
      <a
        v-for="link in SOCIALS"
        :key="link.href"
        :href="link.href"
        target="_blank"
        rel="noopener"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true"><path :d="link.icon" /></svg>
        {{ link.label }}
      </a>
    </div>
  </BootScreen>
</template>

<style scoped>
.connect {
  padding: 0.8rem 1.1rem;
  border: 3px solid #ffd98a;
  background: var(--nw-gold);
  color: #1a1204;
  font-family: var(--nw-font-pixel);
  font-size: 0.66rem;
  line-height: 1.5;
  cursor: pointer;
  clip-path: polygon(
    6px 0,
    calc(100% - 6px) 0,
    100% 6px,
    100% calc(100% - 6px),
    calc(100% - 6px) 100%,
    6px 100%,
    0 calc(100% - 6px),
    0 6px
  );
  box-shadow: 0 5px 0 #8a5606, 0 12px 28px rgba(245, 166, 35, 0.25);
  transition: transform 120ms ease, filter 120ms ease, box-shadow 120ms ease;
}

.connect:hover:not(:disabled) {
  filter: brightness(1.06);
}

.connect:active:not(:disabled) {
  transform: translateY(4px);
  box-shadow: 0 1px 0 #8a5606;
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

.about {
  margin: 1rem 0 0;
  padding-top: 0.9rem;
  border-top: 2px solid rgba(91, 110, 168, 0.45);
  color: rgba(214, 222, 255, 0.78);
  font-size: 0.82rem;
  line-height: 1.5;
}

.socials {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 0.9rem;
}

.socials a {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.7rem;
  background: rgba(88, 196, 255, 0.12);
  border: 2px solid #3b4a78;
  color: var(--nw-text);
  font-family: var(--nw-font-pixel);
  font-size: 0.55rem;
  text-decoration: none;
  clip-path: polygon(
    5px 0,
    calc(100% - 5px) 0,
    100% 5px,
    100% calc(100% - 5px),
    calc(100% - 5px) 100%,
    5px 100%,
    0 calc(100% - 5px),
    0 5px
  );
}

.socials svg {
  width: 0.95rem;
  height: 0.95rem;
  fill: currentColor;
}

.socials a:hover {
  background: rgba(88, 196, 255, 0.22);
  border-color: #5b6ea8;
}
</style>
