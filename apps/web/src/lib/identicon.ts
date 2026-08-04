// The package entry fetches identicons.min.svg at runtime and renders a plain
// blob when that fetch fails. The bundle build inlines the sprite sheet.
import Identicons from '@nimiq/identicons/dist/identicons.bundle.min.js'

const cache = new Map<string, string>()

/**
 * Identicons hash the input string verbatim, so "NQ12 ABCD…" and "NQ12ABCD…"
 * draw different faces. Hub/Wallet/NimConnect all pass the spaced form — match
 * it, or the same account looks different here than everywhere else.
 */
export function toUserFriendlyAddress(address: string): string {
  const raw = address.replace(/\s/g, '').toUpperCase()
  return raw.match(/.{1,4}/g)?.join(' ') ?? raw
}

/** Render a Nimiq identicon as an SVG data URL for avatar images. */
export async function identiconDataUrl(address: string): Promise<string> {
  const key = toUserFriendlyAddress(address)
  const hit = cache.get(key)
  if (hit) return hit

  const url = await Identicons.toDataUrl(key)
  cache.set(key, url)
  return url
}
