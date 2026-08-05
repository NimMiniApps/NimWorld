import type { AuthSession, ProfileClient } from '@nimconnect/profile-client'
import { getResolvedAddress, isNimiqPayHost } from '@/auth/session'

export const NIMCONNECT_AUDIENCE = 'nimworld'
export const NIMCONNECT_FRIEND_SCOPES = ['friends:read', 'friends:write'] as const

const DB_NAME = 'nimworld-auth'
const STORE_NAME = 'grants'
const GRANT_KEY = 'nimconnect:nimworld'
const HUB_URL = import.meta.env.VITE_NIMIQ_HUB_URL?.trim() || 'https://hub.nimiq.com'

let autoConnectAttempted = false
let memoryGrant: AuthSession | null = null

function compact(address: string): string {
  return address.replace(/\s+/g, '').toUpperCase()
}

async function withStore<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T | undefined> {
  if (!globalThis.indexedDB) return undefined
  return new Promise((resolve, reject) => {
    const open = indexedDB.open(DB_NAME, 1)
    open.onupgradeneeded = () => {
      if (!open.result.objectStoreNames.contains(STORE_NAME)) open.result.createObjectStore(STORE_NAME)
    }
    open.onerror = () => reject(open.error)
    open.onsuccess = () => {
      const db = open.result
      const tx = db.transaction(STORE_NAME, mode)
      const request = run(tx.objectStore(STORE_NAME))
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
      tx.oncomplete = () => db.close()
    }
  })
}

export async function storedAuthorization(): Promise<AuthSession | null> {
  try {
    const stored = (await withStore<AuthSession>('readonly', store => store.get(GRANT_KEY))) ?? memoryGrant
    const address = getResolvedAddress()
    if (!stored || !address || compact(stored.address) !== compact(address) || stored.expiresAt * 1000 <= Date.now()) {
      if (stored) await clearFriendsSession()
      return null
    }
    memoryGrant = stored
    return stored
  } catch {
    return memoryGrant
  }
}

async function persistAuthorization(grant: AuthSession): Promise<void> {
  memoryGrant = grant
  try { await withStore('readwrite', store => store.put(grant, GRANT_KEY)) } catch { /* memory fallback */ }
}

export async function clearFriendsSession(): Promise<void> {
  memoryGrant = null
  try { await withStore('readwrite', store => store.delete(GRANT_KEY)) } catch { /* best-effort */ }
}

export async function shouldAutoConnectFriends(): Promise<boolean> {
  if (autoConnectAttempted || !getResolvedAddress()) return false
  return !(await storedAuthorization())
}

export function skipAutoConnectFriends(): void {
  autoConnectAttempted = true
}

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
  const signed = await new HubApi(HUB_URL).signMessage({ appName: 'NimWorld', message, signer: address })
  return { publicKey: toHex(signed.signerPublicKey), signature: toHex(signed.signature) }
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
}

/** Restores or creates the minimal NimWorld grant with one readable v3 signature. */
export async function createFriendsAuthorization(client: ProfileClient): Promise<AuthSession> {
  const stored = await storedAuthorization()
  if (stored) return stored
  const address = getResolvedAddress()
  if (!address) throw new Error('Sign in first')
  const grant = await client.createAuthorization({
    address,
    scopes: [...NIMCONNECT_FRIEND_SCOPES],
    signMessage,
  })
  await persistAuthorization(grant)
  return grant
}
