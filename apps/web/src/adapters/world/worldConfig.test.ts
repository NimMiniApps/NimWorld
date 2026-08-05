import { afterEach, describe, expect, it, vi } from 'vitest'
import { NIMWORLD_TIP_ADDRESS } from '@/adapters/payment/paymentConfig'
import { fetchWorldConfig } from './worldConfig'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('fetchWorldConfig', () => {
  it('takes the tip address the API serves', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ version: 1, tipAddress: 'NQ99 SERVER SIDE' }),
      }),
    )

    await expect(fetchWorldConfig()).resolves.toEqual({
      version: 1,
      tipAddress: 'NQ99 SERVER SIDE',
    })
  })

  // The plaza must open even with the API down, so every failure path is a
  // fallback rather than a throw.
  it.each([
    ['a rejected fetch', vi.fn().mockRejectedValue(new Error('offline'))],
    ['a non-OK response', vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) })],
    ['an empty tip address', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ tipAddress: '  ' }) })],
  ])('falls back to the compiled address on %s', async (_label, fetchMock) => {
    vi.stubGlobal('fetch', fetchMock)
    await expect(fetchWorldConfig()).resolves.toMatchObject({
      tipAddress: NIMWORLD_TIP_ADDRESS,
    })
  })
})
