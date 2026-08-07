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

function freshGrant(scopes: string[]) {
  return {
    token: 'grant-token',
    address: 'NQ17 VERV F3MQ 283T',
    audience: 'nimworld',
    scopes,
    expiresAt: Math.floor(Date.now() / 1000) + 3600,
  }
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

  it('treats a stored grant missing achievements:read as stale', async () => {
    const session = await load()
    const stale = freshGrant(['friends:read', 'friends:write'])
    const client = {
      createSession: vi.fn().mockResolvedValue({
        token: 'session-token',
        expiresAt: Math.floor(Date.now() / 1000) + 3600,
      }),
      createAuthorization: vi.fn().mockResolvedValue(stale),
    }

    await session.ensureNimConnectAccess(client as never)
    await expect(session.storedAuthorization()).resolves.toBeNull()
  })

  it('ensureNimConnectAccess creates session then authorization with achievements:read', async () => {
    const session = await load()
    const grant = freshGrant(['friends:read', 'friends:write', 'achievements:read'])
    const client = {
      createSession: vi.fn().mockResolvedValue({
        token: 'session-token',
        expiresAt: Math.floor(Date.now() / 1000) + 7200,
      }),
      createAuthorization: vi.fn().mockImplementation(async ({ signMessage: sign }: { signMessage: (m: string) => Promise<unknown> }) => {
        await sign('canonical-v3-message')
        return grant
      }),
    }

    const access = await session.ensureNimConnectAccess(client as never)

    expect(client.createSession).toHaveBeenCalledTimes(1)
    expect(client.createSession).toHaveBeenCalledWith(expect.objectContaining({ address }))
    expect(client.createAuthorization).toHaveBeenCalledTimes(1)
    expect(client.createAuthorization).toHaveBeenCalledWith(expect.objectContaining({
      address,
      scopes: ['friends:read', 'friends:write', 'achievements:read'],
    }))
    expect(access).toEqual({
      sessionToken: 'session-token',
      sessionExpiresAt: expect.any(Number),
      authorization: grant,
    })
    expect(signMessage).toHaveBeenCalledWith(expect.objectContaining({ message: 'canonical-v3-message', signer: address }))
  })

  it('ensureNimConnectAccess restores both tokens for a fresh client options object', async () => {
    const session = await load()
    const grant = freshGrant(['friends:read', 'friends:write', 'achievements:read'])
    const client = {
      createSession: vi.fn().mockResolvedValue({
        token: 'session-token',
        expiresAt: Math.floor(Date.now() / 1000) + 7200,
      }),
      createAuthorization: vi.fn().mockResolvedValue(grant),
    }

    const first = await session.ensureNimConnectAccess(client as never)
    const second = await session.ensureNimConnectAccess({
      createSession: vi.fn(),
      createAuthorization: vi.fn(),
    } as never)

    expect(first).toEqual(second)
    expect(client.createSession).toHaveBeenCalledTimes(1)
    expect(client.createAuthorization).toHaveBeenCalledTimes(1)
    // Shape used by ProfileClientNimConnectAdapter.connectFriends rebuild.
    expect({
      sessionToken: second.sessionToken,
      authorization: second.authorization,
      audience: session.NIMCONNECT_AUDIENCE,
    }).toEqual({
      sessionToken: 'session-token',
      authorization: grant,
      audience: 'nimworld',
    })
  })

  it('requests NimWorld scopes including achievements:read and reuses the stored grant', async () => {
    const grant = freshGrant(['friends:read', 'friends:write', 'achievements:read'])
    const client = {
      createSession: vi.fn().mockResolvedValue({
        token: 'session-token',
        expiresAt: Math.floor(Date.now() / 1000) + 3600,
      }),
      createAuthorization: vi.fn().mockImplementation(async ({ signMessage: sign }: { signMessage: (m: string) => Promise<unknown> }) => {
        await sign('canonical-v3-message')
        return grant
      }),
    }
    const session = await load()
    await expect(session.createFriendsAuthorization(client as never)).resolves.toEqual(grant)
    await expect(session.createFriendsAuthorization(client as never)).resolves.toEqual(grant)
    expect(client.createAuthorization).toHaveBeenCalledTimes(1)
    expect(client.createAuthorization).toHaveBeenCalledWith(expect.objectContaining({
      address, scopes: ['friends:read', 'friends:write', 'achievements:read'],
    }))
  })
})
