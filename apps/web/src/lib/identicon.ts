import Identicons from '@nimiq/identicons'

const cache = new Map<string, string>()

/** Render a Nimiq identicon as an SVG data URL for avatar images. */
export async function identiconDataUrl(address: string): Promise<string> {
  const key = address.trim()
  const hit = cache.get(key)
  if (hit) return hit

  const svg = await Identicons.svg(key)
  const url = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
  cache.set(key, url)
  return url
}
