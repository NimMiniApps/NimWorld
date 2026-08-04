import { lunaToNim } from './paymentConfig'

const AUTH_API_BASE = '/auth-api'

/** Live NIM balance via apps/api -> Nimiq RPC. `null` when unavailable. */
export async function fetchLiveBalanceNim(address: string): Promise<number | null> {
  try {
    const res = await fetch(`${AUTH_API_BASE}/balance?address=${encodeURIComponent(address)}`, {
      credentials: 'include',
    })
    if (!res.ok) return null
    const body = (await res.json()) as { balanceLuna?: number }
    return typeof body.balanceLuna === 'number' ? lunaToNim(body.balanceLuna) : null
  } catch {
    return null
  }
}
