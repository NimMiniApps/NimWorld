import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AppAdapters } from '@/adapters/createAdapters'
import type { PublicProfile } from '@/domain/types'
import { usePlazaStore } from './plazaStore'

const LUNA: PublicProfile = {
  address: 'NQ11 AAAA',
  handle: 'luna',
  displayName: 'Luna',
  source: 'nimconnect',
}

function stubAdapters(lookup: (address: string) => Promise<PublicProfile | null>) {
  const nimconnect = { getProfile: vi.fn(lookup) }
  return { nimconnect } as unknown as AppAdapters & { nimconnect: typeof nimconnect }
}

describe('plazaStore profile sheet', () => {
  beforeEach(() => {
    vi.stubGlobal('sessionStorage', { getItem: () => null, setItem: () => {}, removeItem: () => {} })
    setActivePinia(createPinia())
  })

  it('opens with the fallback label, then fills in the resolved profile', async () => {
    const store = usePlazaStore()
    store.setAdapters(stubAdapters(async () => LUNA))

    const pending = store.openProfileSheet('NQ11 AAAA', 'NQ11 AAA…')
    expect(store.profileSheet).toMatchObject({ loading: true, fallbackLabel: 'NQ11 AAA…' })
    await pending

    expect(store.profileSheet).toMatchObject({ loading: false, profile: LUNA })
  })

  it('keeps the sheet open with a null profile for unknown addresses', async () => {
    const store = usePlazaStore()
    store.setAdapters(stubAdapters(async () => null))

    await store.openProfileSheet('NQ99 ZZZZ', 'Wanderer')

    expect(store.profileSheet).toMatchObject({ loading: false, profile: null })
  })

  it('a slow lookup cannot overwrite a profile opened after it', async () => {
    const store = usePlazaStore()
    let releaseSlow = () => {}
    store.setAdapters(
      stubAdapters(async (address) => {
        if (address !== 'NQ11 AAAA') return LUNA
        await new Promise<void>((resolve) => {
          releaseSlow = resolve
        })
        return LUNA
      }),
    )

    const slow = store.openProfileSheet('NQ11 AAAA', 'Luna')
    await store.openProfileSheet('NQ22 BBBB', 'Pixel')
    releaseSlow()
    await slow

    expect(store.profileSheet?.address).toBe('NQ22 BBBB')
  })

  it('closes', async () => {
    const store = usePlazaStore()
    store.setAdapters(stubAdapters(async () => LUNA))
    await store.openProfileSheet('NQ11 AAAA', 'Luna')

    store.closeProfileSheet()

    expect(store.profileSheet).toBeNull()
  })
})
