// Resolves how NimWorld should identify the current user:
//   - embedded in Nimiq Pay -> @nimiq/mini-app-sdk listAccounts
//   - standalone browser -> Nimiq Hub login, verified by apps/api, gates the plaza
const AUTH_API_BASE = '/auth-api'

// HubApi() with no endpoint defaults to localhost:8080 (dev). Always pass
// production Hub unless explicitly overridden.
const HUB_URL = import.meta.env.VITE_NIMIQ_HUB_URL?.trim() || 'https://hub.nimiq.com'

/** Outside Pay: fail fast so desktop can use Hub. */
const SDK_TIMEOUT_DESKTOP_MS = 2_500
/** Inside Pay: provider can inject after the WebView starts. */
const SDK_TIMEOUT_PAY_MS = 10_000

export type SessionState =
  | { mode: 'embedded'; address: string }
  | { mode: 'authenticated'; address: string }
  | { mode: 'anonymous' }

/** Set once a session is known so createAdapters() can wire it into NimConnect. */
let resolvedAddress: string | null = null

export function getResolvedAddress(): string | null {
  return resolvedAddress
}

/** True when running inside the Nimiq Pay mini-app host. */
export function isNimiqPayHost(
  win: { nimiqPay?: unknown } | undefined = typeof window !== 'undefined' ? window : undefined,
): boolean {
  return Boolean(win?.nimiqPay)
}

function providerError(value: unknown): string | null {
  if (!value || typeof value !== 'object' || !('error' in value)) return null
  const err = (value as { error?: { message?: string } }).error
  return err?.message || 'Nimiq Pay provider request failed.'
}

async function tryEmbeddedSession(): Promise<{ address: string } | null> {
  const inPay = isNimiqPayHost()
  const timeoutMs = inPay ? SDK_TIMEOUT_PAY_MS : SDK_TIMEOUT_DESKTOP_MS
  try {
    const { init } = await import('@nimiq/mini-app-sdk')
    const nimiq = await init({ timeout: timeoutMs })
    const result = await nimiq.listAccounts()
    const error = providerError(result)
    if (error) return null
    if (!Array.isArray(result) || result.length === 0) return null
    const address = String(result[0] ?? '').trim()
    if (!address) return null
    return { address }
  } catch {
    return null
  }
}

async function fetchExistingAddress(): Promise<string | null> {
  try {
    const res = await fetch(`${AUTH_API_BASE}/auth/me`, { credentials: 'include' })
    if (!res.ok) return null
    const body = (await res.json()) as { address: string }
    return body.address
  } catch {
    return null
  }
}

export async function resolveSession(): Promise<SessionState> {
  const embedded = await tryEmbeddedSession()
  if (embedded) {
    resolvedAddress = embedded.address
    return { mode: 'embedded', address: embedded.address }
  }
  const address = await fetchExistingAddress()
  if (address) {
    resolvedAddress = address
    return { mode: 'authenticated', address }
  }
  return { mode: 'anonymous' }
}

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return window.btoa(binary)
}

/** Opens the Nimiq Hub sign-in popup, verifies the signature with apps/api, and returns the address. */
export async function loginWithHub(): Promise<string> {
  if (isNimiqPayHost()) {
    throw new Error('Nimiq Hub login is not available inside Nimiq Pay. Use the wallet account share instead.')
  }

  const challengeRes = await fetch(`${AUTH_API_BASE}/auth/challenge`, { method: 'POST' })
  if (!challengeRes.ok) throw new Error('Could not start login')
  const { nonce, token } = (await challengeRes.json()) as { nonce: string; token: string }

  const { default: HubApi } = await import('@nimiq/hub-api')
  const hubApi = new HubApi(HUB_URL)
  const signed = await hubApi.signMessage({
    appName: 'NimWorld',
    message: nonce,
  })

  const verifyRes = await fetch(`${AUTH_API_BASE}/auth/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      token,
      nonce,
      signer: signed.signer,
      signerPublicKey: uint8ToBase64(signed.signerPublicKey),
      signature: uint8ToBase64(signed.signature),
    }),
  })
  if (!verifyRes.ok) throw new Error('Login could not be verified')
  const { address } = (await verifyRes.json()) as { address: string }
  resolvedAddress = address
  return address
}

export async function logout(): Promise<void> {
  await fetch(`${AUTH_API_BASE}/auth/logout`, { method: 'POST', credentials: 'include' })
  resolvedAddress = null
}
