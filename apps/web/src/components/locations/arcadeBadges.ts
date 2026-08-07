/** Connected = live NimConnect grant; Played = local launch history. Independent. */
export function isConnected(
  app: { id: string; slug: string },
  audiences: Set<string>,
): boolean {
  return audiences.has(app.slug) || audiences.has(app.id)
}

export function isPlayed(
  app: { id: string; slug: string },
  playedAppIds: Set<string>,
): boolean {
  return playedAppIds.has(app.slug) || playedAppIds.has(app.id)
}
