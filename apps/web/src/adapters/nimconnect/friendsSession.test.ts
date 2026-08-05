import { beforeEach, describe, expect, it, vi } from 'vitest'

let address: string | null = 'NQ17 VERV F3MQ 283T'
vi.mock('@/auth/session', () => ({
  getResolvedAddress: () => address,
  isNimiqPayHost: () => false,
}))

const signMessage = vi.fn()
vi.mock('@nimiq/hub-api', () => ({
  default: vi.fn().mockImplementation(() => ({ signMessage })),
}))

async function load() {
  vi.resetModules()
  return import('./friendsSession')
}

describe('friends scoped authorization', () => {
  beforeEach(() => {
    address = 'NQ17 VERV F3MQ 283T'
    signMessage.mockReset().mockResolvedValue({
      signerPublicKey: new Uint8Array([1, 2]),
      signature: new Uint8Array([3, 4]),
    })
    vi.stubGlobal('indexedDB', undefined)
  })

  it('auto-connects once when a wallet is available', async () => {
    const session = await load()
    await expect(session.shouldAutoConnectFriends()).resolves.toBe(true)
    session.skipAutoConnectFriends()
    await expect(session.shouldAutoConnectFriends()).resolves.toBe(false)
  })

  it('does not prompt without a wallet address', async () => {
    address = null
    const { shouldAutoConnectFriends } = await load()
    await expect(shouldAutoConnectFriends()).resolves.toBe(false)
  })

  it('requests only NimWorld friends scopes and reuses the stored grant', async () => {
    const grant = {
      token: 'token', address: 'NQ17 VERV F3MQ 283T', audience: 'nimworld',
      scopes: ['friends:read', 'friends:write'], expiresAt: Math.floor(Date.now() / 1000) + 3600,
    }
    const client = { createAuthorization: vi.fn().mockImplementation(async ({ signMessage: sign }: { signMessage: (m: string) => Promise<unknown> }) => {
      await sign('canonical-v3-message')
      return grant
    }) }
    const session = await load()
    await expect(session.createFriendsAuthorization(client as never)).resolves.toEqual(grant)
    await expect(session.createFriendsAuthorization(client as never)).resolves.toEqual(grant)
    expect(client.createAuthorization).toHaveBeenCalledTimes(1)
    expect(client.createAuthorization).toHaveBeenCalledWith(expect.objectContaining({
      address, scopes: ['friends:read', 'friends:write'],
    }))
    expect(signMessage).toHaveBeenCalledWith(expect.objectContaining({ message: 'canonical-v3-message', signer: address }))
  })
})
