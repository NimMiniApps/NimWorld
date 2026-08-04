export type BottomNavId =
  | 'home'
  | 'apps'
  | 'inventory'
  | 'achievements'
  | 'friends'
  | 'wallet'

export interface BottomNavItem {
  id: BottomNavId
  label: string
}

export const BOTTOM_NAV_ITEMS: BottomNavItem[] = [
  { id: 'home', label: 'Home' },
  { id: 'apps', label: 'Apps' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'achievements', label: 'Achievements' },
  { id: 'friends', label: 'Friends' },
  { id: 'wallet', label: 'Wallet' },
]

const NAV_TO_LOCATION: Record<BottomNavId, string | null> = {
  home: null,
  apps: 'arcade',
  inventory: 'fountain',
  achievements: 'fountain',
  friends: 'social-club',
  wallet: 'marketplace',
}

export function locationIdForNav(id: BottomNavId): string | null {
  return NAV_TO_LOCATION[id]
}

export function navIdsForLocation(locationId: string | null): BottomNavId[] {
  if (!locationId) return ['home']
  return (Object.keys(NAV_TO_LOCATION) as BottomNavId[]).filter(
    (id) => NAV_TO_LOCATION[id] === locationId,
  )
}
