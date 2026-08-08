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

/** Live grant from NimConnect `listAuthorizations` (first-party session). */
export interface AuthorizedApp {
  audience: string
  displayName: string
  iconUrl?: string
  verified: boolean
  scopes: string[]
  grantedAt: number
  expiresAt: number
}

export interface NimConnectAdapter {
  initialize(): Promise<void>
  getCurrentProfile(): Promise<PublicProfile | null>
  /** Public profile of any address — nothing here is private to that user. */
  getProfile(address: string): Promise<PublicProfile | null>
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
  /** Apps the user has granted — requires first-party NimConnect session. */
  listAuthorizedApps(): Promise<AuthorizedApp[]>
  getAchievements(appId?: string): Promise<Achievement[]>
  /** True when achievements come from NimConnect rather than local mock data. */
  achievementsAreLive(): boolean
  /**
   * Best display name from NimConnect (`getApp` / authorized grants).
   * Falls back to the raw `appId` — never invents a pretty name.
   */
  resolveAppDisplayName(appId: string): Promise<string>
  getInventory(appId?: string): Promise<InventoryItem[]>
  requestScopes(scopes: NimConnectScope[]): Promise<PermissionResult>
  openProfile(handle?: string): Promise<void>
  refresh(): Promise<void>
}
