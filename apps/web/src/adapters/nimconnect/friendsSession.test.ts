import { beforeEach, describe, expect, it, vi } from 'vitest'

let address: string | null = 'NQ17 VERV F3MQ 283T'
vi.mock('@/auth/session', () => ({
  getResolvedAddress: () => address,
  isNimiqPayHost: () => false,
}))

const store = new Map<string, string>()

/** Fresh module per test — auto-connect state is per page load, not persisted. */
async function load() {
  vi.resetModules()
  return import('./friendsSession')
}

describe('friends session auto-connect', () => {
  beforeEach(() => {
    store.clear()
    address = 'NQ17 VERV F3MQ 283T'
    vi.stubGlobal('sessionStorage', {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => store.set(k, v),
      removeItem: (k: string) => store.delete(k),
    })
  })

  it('connects at login when there is an address and no token', async () => {
    const { shouldAutoConnectFriends } = await load()
    expect(shouldAutoConnectFriends()).toBe(true)
  })

  it('asks only once per page load', async () => {
    const { shouldAutoConnectFriends, skipAutoConnectFriends } = await load()
    skipAutoConnectFriends()
    expect(shouldAutoConnectFriends()).toBe(false)
  })

  it('asks again after a reload, so a failed attempt is not permanent', async () => {
    const first = await load()
    first.skipAutoConnectFriends()
    expect(first.shouldAutoConnectFriends()).toBe(false)

    const reloaded = await load()
    expect(reloaded.shouldAutoConnectFriends()).toBe(true)
  })

  it('does not prompt without a wallet address', async () => {
    address = null
    const { shouldAutoConnectFriends } = await load()
    expect(shouldAutoConnectFriends()).toBe(false)
  })

  it('does not prompt while a valid token is stored', async () => {
    store.set(
      'nimworld:nimconnect-session',
      JSON.stringify({ token: 't', expiresAt: Math.floor(Date.now() / 1000) + 600 }),
    )
    const { shouldAutoConnectFriends } = await load()
    expect(shouldAutoConnectFriends()).toBe(false)
  })

  it('treats an expired token as no session and clears it', async () => {
    store.set(
      'nimworld:nimconnect-session',
      JSON.stringify({ token: 't', expiresAt: Math.floor(Date.now() / 1000) - 1 }),
    )
    const { shouldAutoConnectFriends } = await load()
    expect(shouldAutoConnectFriends()).toBe(true)
    expect(store.has('nimworld:nimconnect-session')).toBe(false)
  })
})
