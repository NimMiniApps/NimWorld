import { afterEach, describe, expect, it, vi } from 'vitest'
import { activityAgeLabel, fetchActivityFeed } from './activityFeed'

describe('fetchActivityFeed', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('keeps well-formed entries and drops the rest', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          events: [
            { appId: 'nimbomber', address: 'NQ01', type: 'score.posted', text: 'scored 4,200', ts: 1 },
            { appId: 'nimbomber', address: 'NQ02', text: '' },
            { appId: 'nimbomber', text: 'no address' },
          ],
        }),
      })),
    )

    const feed = await fetchActivityFeed()
    expect(feed).toEqual([
      { appId: 'nimbomber', address: 'NQ01', type: 'score.posted', text: 'scored 4,200', ts: 1 },
    ])
  })

  it('returns an empty feed instead of throwing when the API is down', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline') }))
    expect(await fetchActivityFeed()).toEqual([])

    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, json: async () => ({}) })))
    expect(await fetchActivityFeed()).toEqual([])
  })
})

describe('activityAgeLabel', () => {
  it('reads in plaza time', () => {
    const now = 1_000_000_000_000
    const at = (msAgo: number) => (now - msAgo) / 1000
    expect(activityAgeLabel(at(20_000), now)).toBe('just now')
    expect(activityAgeLabel(at(12 * 60_000), now)).toBe('12m ago')
    expect(activityAgeLabel(at(3 * 3_600_000), now)).toBe('3h ago')
    expect(activityAgeLabel(at(50 * 3_600_000), now)).toBe('2d ago')
  })
})
