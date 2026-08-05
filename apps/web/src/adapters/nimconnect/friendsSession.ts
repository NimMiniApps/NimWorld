import type { ProfileClient } from '@nimconnect/profile-client'
import { getResolvedAddress, isNimiqPayHost } from '@/auth/session'

// Friends calls need an authenticated NimConnect session (X-NimConnect-Session).
// Creating one costs a wallet signature, so it is created lazily — only when a
// friends view actually asks for it — and the token is cached in sessionStorage.
/** Audience slug NimConnect binds our session signature to. */
export const NIMCONNECT_AUDIENCE = 'nimworld'

const SESSION_KEY = 'nimworld:nimconnect-session'

/**
 * One auto-connect attempt per page load. Deliberately *not* persisted: a
 * failure here is usually transient (offline, API down), and remembering it
 * across reloads left users stuck with the manual button forever.
 */
let autoConnectAttempted = false
const HUB_URL = import.meta.env.VITE_NIMIQ_HUB_URL?.trim() || 'https://hub.nimiq.com'

interface StoredSession {
  token: string
  /** Unix seconds, as returned by createSession. */
  expiresAt: number
}

export function storedSessionToken(): string | null {
  try {
    const raw = globalThis.sessionStorage?.getItem(SESSION_KEY)
    if (!raw) return null
    const stored = JSON.parse(raw) as StoredSession
    if (stored.expiresAt * 1000 <= Date.now()) {
      clearFriendsSession()
      return null
    }
    return stored.token
  } catch {
    return null
  }
}

export function clearFriendsSession(): void {
  try {
    globalThis.sessionStorage?.removeItem(SESSION_KEY)
  } catch {
    /* best-effort */
  }
}

/**
 * True when login should create the friends session itself — skipped when the
 * user has no wallet, already holds a token, or was asked once this load.
 */
export function shouldAutoConnectFriends(): boolean {
  if (autoConnectAttempted) return false
  return Boolean(getResolvedAddress()) && !storedSessionToken()
}

export function skipAutoConnectFriends(): void {
  autoConnectAttempted = true
}

/** Signs the session challenge with whichever wallet this session came from. */
async function signMessage(message: string): Promise<{ publicKey: string; signature: string }> {
  if (isNimiqPayHost()) {
    const { init } = await import('@nimiq/mini-app-sdk')
    const provider = await init()
    const result = await provider.sign(message)
    if (!result || 'error' in result) {
      throw new Error((result as { error?: { message?: string } })?.error?.message ?? 'Signing failed')
    }
    return { publicKey: result.publicKey, signature: result.signature }
  }

  const address = getResolvedAddress()
  if (!address) throw new Error('Sign in first')
  const { default: HubApi } = await import('@nimiq/hub-api')
  const signed = await new HubApi(HUB_URL).signMessage({
    appName: 'NimWorld',
    message,
    signer: address,
  })
  return { publicKey: toHex(signed.signerPublicKey), signature: toHex(signed.signature) }
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

/** Creates + stores a NimConnect session on `client`. Prompts a wallet signature. */
export async function createFriendsSession(client: ProfileClient): Promise<void> {
  if (client.getSessionToken()) return
  const address = getResolvedAddress()
  if (!address) throw new Error('Sign in first')

  const { token, expiresAt } = await client.createSession({ address, signMessage })
  try {
    globalThis.sessionStorage?.setItem(SESSION_KEY, JSON.stringify({ token, expiresAt }))
  } catch {
    /* best-effort */
  }
}
