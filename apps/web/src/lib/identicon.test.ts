import { describe, expect, it, vi } from 'vitest'

vi.mock('@nimiq/identicons', () => ({
  default: {
    svg: vi.fn(async (address: string) => `<svg>${address}</svg>`),
  },
}))

describe('identiconDataUrl', () => {
  it('caches SVG data URLs per address', async () => {
    const Identicons = (await import('@nimiq/identicons')).default
    const { identiconDataUrl } = await import('@/lib/identicon')

    const a = await identiconDataUrl('NQ01 TEST')
    const b = await identiconDataUrl('NQ01 TEST')
    expect(a).toContain('data:image/svg+xml')
    expect(a).toBe(b)
    expect(Identicons.svg).toHaveBeenCalledTimes(1)
  })
})
