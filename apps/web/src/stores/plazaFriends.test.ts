import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AppAdapters } from '@/adapters/createAdapters'
import { usePlazaStore } from './plazaStore'

const REAL_ROW = { address: 'NQ11 AAAA', handle: 'luna', displayName: 'Luna', statusLabel: 'Friend on NimConnect', presence: 'ghost' as const }

function stubAdapters(connected: boolean) {
  const nimconnect = {
    hasFriendsSession: vi.fn(() => connected),
    getFriends: vi.fn(async () => (connected ? [REAL_ROW] : [])),
    getFriendRequests: vi.fn(async () => [
      { ...REAL_ROW, status: 'pending_in' as const, friendshipId: '1' },
    ]),
    listAuthorizedApps: vi.fn(async () => []),
    connectFriends: vi.fn(async () => {
      connected = true
    }),
    acceptFriendRequest: vi.fn(async () => {}),
  }
  return { nimconnect } as unknown as AppAdapters & { nimconnect: typeof nimconnect }
}

describe('plazaStore friends', () => {
  beforeEach(() => {
    // The store reads the saved plaza position at creation; no DOM in this env.
    vi.stubGlobal('sessionStorage', { getItem: () => null, setItem: () => {}, removeItem: () => {} })
    setActivePinia(createPinia())
  })

  it('does not ask for requests while unconnected', async () => {
    const adapters = stubAdapters(false)
    const store = usePlazaStore()
    store.setAdapters(adapters)

    await store.loadFriends()

    expect(store.friendsConnected).toBe(false)
    expect(store.friends).toEqual([])
    expect(store.friendRequests).toEqual([])
    expect(adapters.nimconnect.getFriendRequests).not.toHaveBeenCalled()
  })

  it('connecting fills in real friends and requests', async () => {
    const adapters = stubAdapters(false)
    const store = usePlazaStore()
    store.setAdapters(adapters)
    await store.loadFriends()

    await store.connectFriends()

    expect(store.friendsConnected).toBe(true)
    expect(store.friends).toEqual([REAL_ROW])
    expect(store.friendRequests).toHaveLength(1)
    expect(store.friendsBusy).toBe(false)
  })

  it('clears busy and rethrows when an action fails', async () => {
    const adapters = stubAdapters(true)
    adapters.nimconnect.acceptFriendRequest.mockRejectedValue(new Error('nope'))
    const store = usePlazaStore()
    store.setAdapters(adapters)

    await expect(store.acceptFriendRequest('1')).rejects.toThrow('nope')
    expect(store.friendsBusy).toBe(false)
  })
})
