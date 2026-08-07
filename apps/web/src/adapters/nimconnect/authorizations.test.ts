import { beforeEach, describe, expect, it, vi } from 'vitest'

const client = {
  getDisplayIdentity: vi.fn(),
  getAuthorization: vi.fn(() => null as { token: string } | null),
  createAuthorization: vi.fn(),
  createSession: vi.fn(),
  listFriends: vi.fn(),
  listFriendRequests: vi.fn(),
  sendFriendRequest: vi.fn(),
  acceptFriendRequest: vi.fn(),
  declineFriendRequest: vi.fn(),
  removeFriend: vi.fn(),
  listAuthorizations: vi.fn(),
  listAchievements: vi.fn(),
}

const clientOptions: Array<Record<string, unknown>> = []
vi.mock('@nimconnect/profile-client', () => ({
  createProfileClient: (options: Record<string, unknown>) => {
    clientOptions.push(options)
    return client
  },
}))
vi.mock('@/auth/session', () => ({
  getResolvedAddress: () => 'NQ17 VERV F3MQ 283T NRSR FPJG 55BJ PMHC N8MD',
  isNimiqPayHost: () => false,
}))
vi.mock('@/lib/identicon', () => ({ identiconDataUrl: async () => 'data:,' }))
vi.mock('./friendsSession', async () => {
  const actual = await vi.importActual<typeof import('./friendsSession')>('./friendsSession')
  return {
    ...actual,
    ensureNimConnectAccess: vi.fn().mockResolvedValue({
      sessionToken: 'first-party',
      sessionExpiresAt: Math.floor(Date.now() / 1000) + 3600,
      authorization: {
        token: 'grant',
        address: 'NQ17 VERV F3MQ 283T NRSR FPJG 55BJ PMHC N8MD',
        audience: 'nimworld',
        scopes: ['friends:read', 'friends:write', 'achievements:read'],
        expiresAt: Math.floor(Date.now() / 1000) + 3600,
      },
    }),
  }
})

const { ProfileClientNimConnectAdapter } = await import('./ProfileClientNimConnectAdapter')

describe('listAuthorizedApps', () => {
  beforeEach(() => {
    clientOptions.length = 0
    client.listAuthorizations.mockReset()
    client.getAuthorization.mockReturnValue(null)
  })

  it('returns [] without a first-party session', async () => {
    const adapter = new ProfileClientNimConnectAdapter()
    expect(await adapter.listAuthorizedApps()).toEqual([])
    expect(client.listAuthorizations).not.toHaveBeenCalled()
  })

  it('maps listAuthorizations audiences to AuthorizedApp', async () => {
    client.listAuthorizations.mockResolvedValue([
      {
        audience: 'nimbomber',
        displayName: 'NimBomber',
        iconUrl: 'https://example.test/nb.png',
        verified: true,
        scopes: ['achievements:read'],
        grantedAt: 1700000000,
        expiresAt: 1700604800,
      },
    ])

    const adapter = new ProfileClientNimConnectAdapter()
    await adapter.connectFriends()
    const apps = await adapter.listAuthorizedApps()

    expect(apps).toEqual([
      {
        audience: 'nimbomber',
        displayName: 'NimBomber',
        iconUrl: 'https://example.test/nb.png',
        verified: true,
        scopes: ['achievements:read'],
        grantedAt: 1700000000,
        expiresAt: 1700604800,
      },
    ])
    expect(clientOptions.at(-1)).toMatchObject({
      sessionToken: 'first-party',
      audience: 'nimworld',
    })
  })

  it('returns [] when listAuthorizations throws', async () => {
    client.listAuthorizations.mockRejectedValue(new Error('session required'))
    const adapter = new ProfileClientNimConnectAdapter()
    await adapter.connectFriends()
    expect(await adapter.listAuthorizedApps()).toEqual([])
  })
})
