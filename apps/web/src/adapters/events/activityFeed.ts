const AUTH_API_BASE = '/auth-api'

/** One line of cross-app activity, as an app's server signed it. */
export interface ActivityEntry {
  appId: string
  address: string
  type: string
  text: string
  ts: number
}

/** Never throws: an empty feed just renders as "nothing yet". */
export async function fetchActivityFeed(): Promise<ActivityEntry[]> {
  try {
    const res = await fetch(`${AUTH_API_BASE}/events/feed`, { credentials: 'include' })
    if (!res.ok) return []
    const body = (await res.json()) as { events?: unknown }
    if (!Array.isArray(body.events)) return []
    return body.events.flatMap((raw) => {
      const e = raw as Partial<ActivityEntry>
      if (!e.address || !e.text) return []
      return [
        {
          appId: String(e.appId ?? ''),
          address: String(e.address),
          type: String(e.type ?? ''),
          text: String(e.text),
          ts: Number(e.ts) || 0,
        },
      ]
    })
  } catch {
    return []
  }
}

/** "just now" / "12m ago" / "3h ago" — same vocabulary as plaza presence. */
export function activityAgeLabel(ts: number, now = Date.now()): string {
  const minutes = Math.floor((now - ts * 1000) / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  return hours < 24 ? `${hours}h ago` : `${Math.floor(hours / 24)}d ago`
}
