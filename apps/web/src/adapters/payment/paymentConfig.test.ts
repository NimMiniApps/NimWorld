import { describe, expect, it } from 'vitest'
import { NIMWORLD_TIP_ADDRESS, nimToLuna, lunaToNim } from './paymentConfig'

describe('paymentConfig', () => {
  it('exposes the locked tip jar address', () => {
    expect(NIMWORLD_TIP_ADDRESS).toBe('NQ57 7NBS GKF1 R9B8 CHF1 0P92 67VG 02FF AL5C')
  })

  it('converts NIM to luna', () => {
    expect(nimToLuna(1)).toBe(100_000)
    expect(nimToLuna(5)).toBe(500_000)
  })

  it('converts luna to NIM', () => {
    expect(lunaToNim(100_000)).toBe(1)
  })
})
