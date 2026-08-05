import { beforeEach, describe, expect, it, vi } from 'vitest'

const client = {
  getDisplayIdentity: vi.fn(),
  getSessionToken: vi.fn(() => null as string | null),
  createSession: vi.fn(),
  listFriends: vi.fn(),
  listFriendRequests: vi.fn(),
  sendFriendRequest: vi.fn(),
  acceptFriendRequest: vi.fn(),
  declineFriendRequest: vi.fn(),
  removeFriend: vi.fn(),
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

const { ProfileClientNimConnectAdapter } = await import('./ProfileClientNimConnectAdapter')

describe('friends via NimConnect', () => {
  beforeEach(() => {
    client.getSessionToken.mockReturnValue(null)
    client.listFriends.mockReset()
  })

  it('reports no friends without a session rather than inventing them', async () => {
    const adapter = new ProfileClientNimConnectAdapter()
    expect(adapter.hasFriendsSession()).toBe(false)
    expect(await adapter.getFriends()).toEqual([])
    expect(client.listFriends).not.toHaveBeenCalled()
  })

  it('maps real friend entries once a session exists', async () => {
    client.getSessionToken.mockReturnValue('token')
    client.listFriends.mockResolvedValue([
      { address: 'NQ11 AAAA', handle: 'luna', displayName: 'Luna', status: 'accepted', friendshipId: '1' },
      { address: 'NQ22 BBBB CCCC DDDD EEEE', status: 'pending_out', friendshipId: '2' },
    ])

    const friends = await new ProfileClientNimConnectAdapter().getFriends()

    expect(friends[0]).toMatchObject({ handle: 'luna', displayName: 'Luna', statusLabel: 'Friend on NimConnect' })
    // No handle: falls back to a shortened address, and stays honest about status.
    expect(friends[1]).toMatchObject({ handle: '', displayName: 'NQ22BBBB…', statusLabel: 'Request sent' })
    expect(friends.every((f) => f.presence === 'ghost')).toBe(true)
  })

  it('returns an empty list when the friends call fails', async () => {
    client.getSessionToken.mockReturnValue('token')
    client.listFriends.mockRejectedValue(new Error('401'))

    expect(await new ProfileClientNimConnectAdapter().getFriends()).toEqual([])
  })

  it('returns no pending requests without a session', async () => {
    expect(await new ProfileClientNimConnectAdapter().getFriendRequests()).toEqual([])
    expect(client.listFriendRequests).not.toHaveBeenCalled()
  })

  it('keeps request direction so the UI can offer accept vs cancel', async () => {
    client.getSessionToken.mockReturnValue('token')
    client.listFriendRequests.mockResolvedValue([
      { address: 'NQ11 AAAA', handle: 'luna', status: 'pending_in', friendshipId: '1' },
      { address: 'NQ22 BBBB', handle: 'nova', status: 'pending_out', friendshipId: '2' },
    ])

    const pending = await new ProfileClientNimConnectAdapter().getFriendRequests()

    expect(pending.map((p) => [p.status, p.friendshipId, p.statusLabel])).toEqual([
      ['pending_in', '1', 'Wants to be friends'],
      ['pending_out', '2', 'Request sent'],
    ])
  })

  it('binds the session signature to the nimworld audience', () => {
    clientOptions.length = 0
    new ProfileClientNimConnectAdapter()
    expect(clientOptions[0]).toMatchObject({ audience: 'nimworld' })
  })

  it('strips a leading @ before sending a request', async () => {
    await new ProfileClientNimConnectAdapter().sendFriendRequest(' @luna ')
    expect(client.sendFriendRequest).toHaveBeenCalledWith('luna')
  })
})
