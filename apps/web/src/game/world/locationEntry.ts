export function getLocationToAutoOpen(
  activeTargetId: string | null,
  nearestLocationId: string | null,
): string | null {
  if (!nearestLocationId || nearestLocationId === activeTargetId) return null
  return nearestLocationId
}
