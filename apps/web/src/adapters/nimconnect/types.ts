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
  /** True once a NimConnect session exists, i.e. getFriends() returns real data. */
  hasFriendsSession(): boolean
  /** Creates the NimConnect session for friends — prompts a wallet signature. */
  connectFriends(): Promise<void>
  /** Pending friend requests, incoming and outgoing. Empty without a session. */
  getFriendRequests(): Promise<PublicFriend[]>
  /** `to` is a @handle or an address. */
  sendFriendRequest(to: string): Promise<void>
  acceptFriendRequest(friendshipId: string): Promise<void>
  declineFriendRequest(friendshipId: string): Promise<void>
  removeFriend(address: string): Promise<void>
  getAchievements(appId?: string): Promise<Achievement[]>
  getInventory(appId?: string): Promise<InventoryItem[]>
  requestScopes(scopes: NimConnectScope[]): Promise<PermissionResult>
  openProfile(handle?: string): Promise<void>
  refresh(): Promise<void>
}
