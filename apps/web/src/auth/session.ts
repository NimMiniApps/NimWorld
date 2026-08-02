// Resolves how NimWorld should identify the current user:
//   - embedded in Nimiq Pay -> @nimiq/mini-app-sdk already provides identity
//   - standalone browser -> Nimiq Hub login, verified by apps/api, gates the plaza
const AUTH_API_BASE = '/auth-api'

export type SessionState =
  | { mode: 'embedded' }
  | { mode: 'authenticated'; address: string }
  | { mode: 'anonymous' }

/** Set once a session is known so createAdapters() can wire it into NimConnect. */
let resolvedAddress: string | null = null

export function getResolvedAddress(): string | null {
  return resolvedAddress
}

async function tryEmbeddedInit(timeoutMs = 1500): Promise<boolean> {
  try {
    const { init } = await import('@nimiq/mini-app-sdk')
    const timeout = new Promise<never>((_, reject) =>
      window.setTimeout(() => reject(new Error('mini-app-sdk init timed out')), timeoutMs),
    )
    await Promise.race([init(), timeout])
    return true
  } catch {
    return false
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
  if (await tryEmbeddedInit()) {
    return { mode: 'embedded' }
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
  const challengeRes = await fetch(`${AUTH_API_BASE}/auth/challenge`, { method: 'POST' })
  if (!challengeRes.ok) throw new Error('Could not start login')
  const { nonce, token } = (await challengeRes.json()) as { nonce: string; token: string }

  const { default: HubApi } = await import('@nimiq/hub-api')
  const hubApi = new HubApi()
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
