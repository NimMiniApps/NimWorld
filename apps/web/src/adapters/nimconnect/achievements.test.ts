import { beforeEach, describe, expect, it, vi } from 'vitest'

const client = {
  getDisplayIdentity: vi.fn(),
  getAuthorization: vi.fn(() => null),
  createAuthorization: vi.fn(),
  listFriends: vi.fn(),
  listFriendRequests: vi.fn(),
  sendFriendRequest: vi.fn(),
  acceptFriendRequest: vi.fn(),
  declineFriendRequest: vi.fn(),
  removeFriend: vi.fn(),
  listAuthorizations: vi.fn(),
  listAchievements: vi.fn(),
}

vi.mock('@nimconnect/profile-client', () => ({
  createProfileClient: () => client,
}))
vi.mock('@/auth/session', () => ({
  getResolvedAddress: () => 'NQ17 VERV F3MQ 283T NRSR FPJG 55BJ PMHC N8MD',
  isNimiqPayHost: () => false,
}))
vi.mock('@/lib/identicon', () => ({ identiconDataUrl: async () => 'data:,' }))

const { ProfileClientNimConnectAdapter } = await import('./ProfileClientNimConnectAdapter')

describe('getAchievements', () => {
  beforeEach(() => {
    client.listAchievements.mockReset()
  })

  it('returns [] without an address (no mock fallback in the real adapter)', async () => {
    const adapter = new ProfileClientNimConnectAdapter()
    expect(await adapter.getAchievements()).toEqual([])
    expect(client.listAchievements).not.toHaveBeenCalled()
  })

  it('maps validated achievements and converts grantedAt to unlockedAt ISO', async () => {
    client.listAchievements.mockResolvedValue([
      {
        appId: 'nimbomber',
        achievementId: 'first-blast',
        address: 'NQ01',
        title: 'First Blast',
        description: 'Win your first match.',
        rarity: 'common',
        visibility: 'public',
        grantedAt: 1700000000,
      },
    ])

    const adapter = new ProfileClientNimConnectAdapter('NQ17 VERV F3MQ 283T')
    const list = await adapter.getAchievements()

    expect(list).toEqual([
      {
        appId: 'nimbomber',
        achievementId: 'first-blast',
        title: 'First Blast',
        description: 'Win your first match.',
        rarity: 'common',
        unlockedAt: new Date(1700000000 * 1000).toISOString(),
      },
    ])
  })

  it('drops payloads missing title or with bad rarity', async () => {
    client.listAchievements.mockResolvedValue([
      {
        appId: 'nimbomber',
        achievementId: 'no-title',
        address: 'NQ01',
        title: '',
        description: 'Missing title',
        rarity: 'common',
        visibility: 'public',
        grantedAt: 1700000000,
      },
      {
        appId: 'nimbomber',
        achievementId: 'mythic-one',
        address: 'NQ01',
        title: 'Mythic',
        description: 'Bad rarity',
        rarity: 'mythic',
        visibility: 'public',
        grantedAt: 1700000000,
      },
      {
        appId: 'nimbomber',
        achievementId: 'ok',
        address: 'NQ01',
        title: 'OK',
        description: 'Valid',
        rarity: 'rare',
        visibility: 'public',
        grantedAt: 1700000001,
      },
    ])

    const adapter = new ProfileClientNimConnectAdapter('NQ17 VERV F3MQ 283T')
    const list = await adapter.getAchievements()
    expect(list.map((a) => a.achievementId)).toEqual(['ok'])
  })

  it('maps API progress.total to envelope progress.target', async () => {
    client.listAchievements.mockResolvedValue([
      {
        appId: 'playnimiq',
        achievementId: 'snake-100',
        address: 'NQ01',
        title: 'Snake Streak',
        description: 'Score 100',
        rarity: 'uncommon',
        visibility: 'public',
        grantedAt: 0,
        progress: { current: 72, total: 100 },
      },
    ])

    const adapter = new ProfileClientNimConnectAdapter('NQ17 VERV F3MQ 283T')
    const list = await adapter.getAchievements()
    expect(list[0]?.progress).toEqual({ current: 72, target: 100 })
  })

  it('filters by optional appId', async () => {
    client.listAchievements.mockResolvedValue([
      {
        appId: 'nimbomber',
        achievementId: 'a',
        address: 'NQ01',
        title: 'A',
        description: 'A',
        rarity: 'common',
        visibility: 'public',
        grantedAt: 1,
      },
      {
        appId: 'playnimiq',
        achievementId: 'b',
        address: 'NQ01',
        title: 'B',
        description: 'B',
        rarity: 'common',
        visibility: 'public',
        grantedAt: 2,
      },
    ])

    const adapter = new ProfileClientNimConnectAdapter('NQ17 VERV F3MQ 283T')
    expect((await adapter.getAchievements('playnimiq')).map((a) => a.appId)).toEqual(['playnimiq'])
  })

  it('returns [] when listAchievements throws', async () => {
    client.listAchievements.mockRejectedValue(new Error('500'))
    const adapter = new ProfileClientNimConnectAdapter('NQ17 VERV F3MQ 283T')
    expect(await adapter.getAchievements()).toEqual([])
  })
})
