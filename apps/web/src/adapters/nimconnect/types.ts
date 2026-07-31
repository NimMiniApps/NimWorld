import type {
  Achievement,
  InventoryItem,
  NimConnectScope,
  PublicFriend,
  PublicProfile,
} from '@/domain/types'

export interface PermissionResult {
  granted: NimConnectScope[]
  denied: NimConnectScope[]
  note?: string
}

export interface NimConnectAdapter {
  initialize(): Promise<void>
  getCurrentProfile(): Promise<PublicProfile | null>
  getFriends(): Promise<PublicFriend[]>
  getAchievements(appId?: string): Promise<Achievement[]>
  getInventory(appId?: string): Promise<InventoryItem[]>
  requestScopes(scopes: NimConnectScope[]): Promise<PermissionResult>
  openProfile(handle?: string): Promise<void>
  refresh(): Promise<void>
}
