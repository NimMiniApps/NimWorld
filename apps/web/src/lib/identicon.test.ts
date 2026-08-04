import { describe, expect, it, vi } from 'vitest'

vi.mock('@nimiq/identicons/dist/identicons.bundle.min.js', () => ({
  default: {
    toDataUrl: vi.fn(async (address: string) => `data:image/svg+xml,${address}`),
  },
}))

describe('identiconDataUrl', () => {
  it('hashes the spaced address, so both formats draw the same face', async () => {
    const Identicons = (await import('@nimiq/identicons/dist/identicons.bundle.min.js')).default
    const { identiconDataUrl } = await import('@/lib/identicon')

    const spaced = await identiconDataUrl('NQ57 7NBS GKF1 R9B8 CHF1 0P92 67VG 02FF AL5C')
    vi.mocked(Identicons.toDataUrl).mockClear()
    const packed = await identiconDataUrl('NQ577NBSGKF1R9B8CHF10P9267VG02FFAL5C')

    expect(packed).toBe(spaced)
    // Second call hits the cache: both formats normalise to the same key.
    expect(Identicons.toDataUrl).not.toHaveBeenCalled()
  })

  it('caches SVG data URLs per address', async () => {
    const Identicons = (await import('@nimiq/identicons/dist/identicons.bundle.min.js')).default
    const { identiconDataUrl } = await import('@/lib/identicon')

    const a = await identiconDataUrl('NQ01 TEST')
    const b = await identiconDataUrl('NQ01 TEST')
    expect(a).toContain('data:image/svg+xml')
    expect(a).toBe(b)
    expect(Identicons.toDataUrl).toHaveBeenCalledTimes(1)
  })
})
