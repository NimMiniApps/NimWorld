import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchLiveBalanceNim } from './balanceApi'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('fetchLiveBalanceNim', () => {
  it('converts luna to NIM', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ balanceLuna: 125045000 }) }),
    )
    await expect(fetchLiveBalanceNim('NQ57')).resolves.toBe(1250.45)
  })

  it('returns null when the API fails or the body is empty', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) }))
    await expect(fetchLiveBalanceNim('NQ57')).resolves.toBeNull()

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    await expect(fetchLiveBalanceNim('NQ57')).resolves.toBeNull()
  })
})
