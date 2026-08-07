import type { AuthSession, ProfileClient } from '@nimconnect/profile-client'
import { getResolvedAddress, isNimiqPayHost } from '@/auth/session'

export const NIMCONNECT_AUDIENCE = 'nimworld'
export const NIMCONNECT_SCOPES = [
  'friends:read',
  'friends:write',
  'achievements:read',
] as const
/** @deprecated Use NIMCONNECT_SCOPES */
export const NIMCONNECT_FRIEND_SCOPES = NIMCONNECT_SCOPES

const DB_NAME = 'nimworld-auth'
const STORE_NAME = 'grants'
const GRANT_KEY = 'nimconnect:nimworld'
const SESSION_KEY = 'nimconnect:session'
const HUB_URL = import.meta.env.VITE_NIMIQ_HUB_URL?.trim() || 'https://hub.nimiq.com'

export type NimConnectAccess = {
  sessionToken: string
  sessionExpiresAt: number
  authorization: AuthSession
}

type StoredSession = { token: string; expiresAt: number }

let autoConnectAttempted = false
let memoryGrant: AuthSession | null = null
let memorySession: StoredSession | null = null

function compact(address: string): string {
  return address.replace(/\s+/g, '').toUpperCase()
}

function hasRequiredScopes(grant: AuthSession): boolean {
  const scopes = new Set(grant.scopes)
  return NIMCONNECT_SCOPES.every((scope) => scopes.has(scope))
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

export async function storedSession(): Promise<StoredSession | null> {
  try {
    const stored = (await withStore<StoredSession>('readonly', store => store.get(SESSION_KEY))) ?? memorySession
    if (!stored || stored.expiresAt * 1000 <= Date.now()) {
      if (stored) await clearStoredSession()
      return null
    }
    memorySession = stored
    return stored
  } catch {
    return memorySession && memorySession.expiresAt * 1000 > Date.now() ? memorySession : null
  }
}

async function persistSession(session: StoredSession): Promise<void> {
  memorySession = session
  try { await withStore('readwrite', store => store.put(session, SESSION_KEY)) } catch { /* memory fallback */ }
}

async function clearStoredSession(): Promise<void> {
  memorySession = null
  try { await withStore('readwrite', store => store.delete(SESSION_KEY)) } catch { /* best-effort */ }
}

export async function storedAuthorization(): Promise<AuthSession | null> {
  try {
    const stored = (await withStore<AuthSession>('readonly', store => store.get(GRANT_KEY))) ?? memoryGrant
    const address = getResolvedAddress()
    if (
      !stored
      || !address
      || compact(stored.address) !== compact(address)
      || stored.expiresAt * 1000 <= Date.now()
      || !hasRequiredScopes(stored)
    ) {
      if (stored) await clearStoredGrant()
      return null
    }
    memoryGrant = stored
    return stored
  } catch {
    if (memoryGrant && hasRequiredScopes(memoryGrant)) return memoryGrant
    return null
  }
}

async function persistAuthorization(grant: AuthSession): Promise<void> {
  memoryGrant = grant
  try { await withStore('readwrite', store => store.put(grant, GRANT_KEY)) } catch { /* memory fallback */ }
}

async function clearStoredGrant(): Promise<void> {
  memoryGrant = null
  try { await withStore('readwrite', store => store.delete(GRANT_KEY)) } catch { /* best-effort */ }
}

export async function clearFriendsSession(): Promise<void> {
  await clearStoredGrant()
  await clearStoredSession()
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

/**
 * Ensures a first-party NimConnect session plus the NimWorld v3 grant
 * (friends + achievements:read). Two signatures on first connect is intentional.
 */
export async function ensureNimConnectAccess(client: ProfileClient): Promise<NimConnectAccess> {
  const address = getResolvedAddress()
  if (!address) throw new Error('Sign in first')

  let session = await storedSession()
  if (!session) {
    const created = await client.createSession({ address, signMessage })
    session = { token: created.token, expiresAt: created.expiresAt }
    await persistSession(session)
  }

  let authorization = await storedAuthorization()
  if (!authorization) {
    authorization = await client.createAuthorization({
      address,
      scopes: [...NIMCONNECT_SCOPES],
      signMessage,
    })
    await persistAuthorization(authorization)
  }

  return {
    sessionToken: session.token,
    sessionExpiresAt: session.expiresAt,
    authorization,
  }
}

/** Restores or creates NimWorld access; returns the v3 grant for back-compat callers. */
export async function createFriendsAuthorization(client: ProfileClient): Promise<AuthSession> {
  const access = await ensureNimConnectAccess(client)
  return access.authorization
}
