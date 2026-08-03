export const NIMWORLD_TIP_ADDRESS =
  (typeof import.meta !== 'undefined' &&
    import.meta.env?.VITE_NIMWORLD_TIP_ADDRESS?.trim()) ||
  'NQ57 7NBS GKF1 R9B8 CHF1 0P92 67VG 02FF AL5C'

export const LUNA_PER_NIM = 100_000

export function nimToLuna(nim: number): number {
  return Math.round(nim * LUNA_PER_NIM)
}

export function lunaToNim(luna: number): number {
  return luna / LUNA_PER_NIM
}
