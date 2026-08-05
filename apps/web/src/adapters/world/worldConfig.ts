import { NIMWORLD_TIP_ADDRESS } from '@/adapters/payment/paymentConfig'

const AUTH_API_BASE = '/auth-api'

export interface WorldConfig {
  version: number
  /** Where tips go. Server-owned so it can be rotated without a client build. */
  tipAddress: string
}

export const FALLBACK_WORLD_CONFIG: WorldConfig = {
  version: 1,
  tipAddress: NIMWORLD_TIP_ADDRESS,
}

/** Never throws: the plaza opens with the compiled defaults if the API is down. */
export async function fetchWorldConfig(): Promise<WorldConfig> {
  try {
    const res = await fetch(`${AUTH_API_BASE}/world`, { credentials: 'include' })
    if (!res.ok) return FALLBACK_WORLD_CONFIG
    const body = (await res.json()) as Partial<WorldConfig>
    return {
      version: typeof body.version === 'number' ? body.version : 1,
      tipAddress: body.tipAddress?.trim() || NIMWORLD_TIP_ADDRESS,
    }
  } catch {
    return FALLBACK_WORLD_CONFIG
  }
}
