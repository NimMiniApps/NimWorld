import { createProfileClient, type FriendEntry } from '@nimconnect/profile-client'
import { validateAchievement } from '@nimworld/app-manifest'
import type {
  Achievement,
  InventoryItem,
  NimConnectScope,
  PublicFriend,
  PublicProfile,
} from '@/domain/types'
import { identiconDataUrl } from '@/lib/identicon'
import {
  MOCK_INVENTORY,
  MOCK_PROFILE,
} from './mockData'
import { ensureNimConnectAccess, NIMCONNECT_AUDIENCE } from './friendsSession'
import type { AuthorizedApp, NimConnectAdapter, PermissionResult } from './types'
import { openNimconnect } from './links'

/**
 * Uses real @nimconnect/profile-client for public profile/handle lookup and,
 * once a NimConnect session exists, for friends and authorizations.
 * Achievements load from NimConnect when signed in; inventory stays mocked.
 */
export class ProfileClientNimConnectAdapter implements NimConnectAdapter {
  private client = createProfileClient({
    baseUrl: nimconnectApiBase(),
    // The v3 grant is audience-bound and cannot be replayed as NimConnect.
    audience: NIMCONNECT_AUDIENCE,
  })
  private address: string | null = null
  private cachedProfile: PublicProfile | null = null
  /** Tracked separately — profile-client's getSessionToken() prefers the grant. */
  private firstPartySessionToken: string | null = null

  constructor(private readonly fallbackAddress?: string) {}

  setAddress(address: string | null) {
    this.address = address
  }

  private hasFirstPartySession(): boolean {
    return Boolean(this.firstPartySessionToken)
  }

  async initialize(): Promise<void> {
    const address = this.address ?? this.fallbackAddress ?? null
    if (!address) {
      this.cachedProfile = await withIdenticon({ ...MOCK_PROFILE, source: 'mock' })
      return
    }

    this.cachedProfile =
      (await this.getProfile(address)) ??
      (await withIdenticon({ ...MOCK_PROFILE, address, source: 'mock' }))
  }

  async getCurrentProfile(): Promise<PublicProfile | null> {
    if (!this.cachedProfile) await this.initialize()
    return this.cachedProfile
  }

  /** Public lookup — same call for our own address and anyone else's. */
  async getProfile(address: string): Promise<PublicProfile | null> {
    try {
      const identity = await this.client.getDisplayIdentity(address)
      return await withIdenticon({
        address: identity.address,
        handle: identity.handle,
        displayName: identity.displayName,
        bio: identity.bio,
        source: 'nimconnect',
      })
    } catch {
      return null
    }
  }

  hasFriendsSession(): boolean {
    return Boolean(this.client.getAuthorization())
  }

  async connectFriends(): Promise<void> {
    const access = await ensureNimConnectAccess(this.client)
    this.firstPartySessionToken = access.sessionToken
    this.client = createProfileClient({
      baseUrl: nimconnectApiBase(),
      audience: NIMCONNECT_AUDIENCE,
      sessionToken: access.sessionToken,
      authorization: access.authorization,
    })
  }

  async listAuthorizedApps(): Promise<AuthorizedApp[]> {
    if (!this.hasFirstPartySession()) return []
    try {
      const grants = await this.client.listAuthorizations()
      return grants.map((g) => ({
        audience: g.audience,
        displayName: g.displayName,
        ...(g.iconUrl ? { iconUrl: g.iconUrl } : {}),
        verified: g.verified,
        scopes: [...g.scopes],
        grantedAt: g.grantedAt,
        expiresAt: g.expiresAt,
      }))
    } catch {
      return []
    }
  }

  // No session, no friends — an invented list is worse than an empty one.
  async getFriends(): Promise<PublicFriend[]> {
    if (!this.hasFriendsSession()) return []
    try {
      return await Promise.all((await this.client.listFriends()).map(toPublicFriend))
    } catch {
      return []
    }
  }

  async getFriendRequests(): Promise<PublicFriend[]> {
    if (!this.hasFriendsSession()) return []
    return Promise.all((await this.client.listFriendRequests()).map(toPublicFriend))
  }

  async sendFriendRequest(to: string): Promise<void> {
    await this.client.sendFriendRequest(to.trim().replace(/^@/, ''))
  }

  async acceptFriendRequest(friendshipId: string): Promise<void> {
    await this.client.acceptFriendRequest(friendshipId)
  }

  async declineFriendRequest(friendshipId: string): Promise<void> {
    await this.client.declineFriendRequest(friendshipId)
  }

  async removeFriend(address: string): Promise<void> {
    await this.client.removeFriend(address)
  }

  async getAchievements(appId?: string): Promise<Achievement[]> {
    const address = this.address ?? this.fallbackAddress
    if (!address) return []
    try {
      const raw = await this.client.listAchievements(address)
      return raw
        .map(fromNimConnectAchievement)
        .filter((a): a is Achievement => a !== null)
        .filter((a) => !appId || a.appId === appId)
    } catch {
      return []
    }
  }

  async getInventory(appId?: string): Promise<InventoryItem[]> {
    return MOCK_INVENTORY.filter((i) => !appId || i.appId === appId || !i.appId).map((i) => ({
      ...i,
    }))
  }

  async requestScopes(scopes: NimConnectScope[]): Promise<PermissionResult> {
    const supported: NimConnectScope[] = ['profile:read', 'friends:read', 'achievements:read']
    const granted = scopes.filter((s) => supported.includes(s))
    const denied = scopes.filter((s) => !supported.includes(s))
    return {
      granted,
      denied,
      note:
        denied.length > 0
          ? 'Inventory and messaging scopes are not available from NimConnect yet. Mock data is used instead.'
          : undefined,
    }
  }

  async openProfile(handle?: string): Promise<void> {
    openNimconnect(handle ?? this.cachedProfile?.handle)
  }

  async refresh(): Promise<void> {
    await this.initialize()
  }
}

/**
 * Session and friends are POST/DELETE, which NimConnect only allows from
 * origins on its ALLOW_ORIGIN list — localhost is not one. In dev we go
 * through the Vite proxy (same-origin, no CORS); deployed NimWorld needs its
 * own origin added to NimConnect's allow-list. `undefined` = package default.
 */
function nimconnectApiBase(): string | undefined {
  const configured = import.meta.env.VITE_NIMCONNECT_API?.trim()
  if (configured) return configured
  return import.meta.env.DEV ? '/nimconnect-api' : undefined
}

const FRIEND_STATUS_LABEL = {
  accepted: 'Friend on NimConnect',
  pending_in: 'Wants to be friends',
  pending_out: 'Request sent',
} as const

/** NimConnect knows the friendship, not the plaza presence — labels stay honest. */
async function toPublicFriend(entry: FriendEntry): Promise<PublicFriend> {
  const friend: PublicFriend = {
    address: entry.address,
    handle: entry.handle ?? '',
    displayName: entry.displayName || entry.handle || shortAddress(entry.address),
    statusLabel: FRIEND_STATUS_LABEL[entry.status] ?? 'Request pending',
    presence: 'ghost',
    friendshipId: entry.friendshipId,
    status: entry.status,
  }
  try {
    return { ...friend, avatarDataUrl: await identiconDataUrl(entry.address) }
  } catch {
    return friend
  }
}

function shortAddress(address: string): string {
  const compact = address.replace(/\s+/g, '')
  return compact.length <= 12 ? compact : `${compact.slice(0, 8)}…`
}

async function withIdenticon(profile: PublicProfile): Promise<PublicProfile> {
  try {
    return { ...profile, avatarDataUrl: await identiconDataUrl(profile.address) }
  } catch {
    return profile
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function mapProgress(progress: unknown): { current: number; target: number } | undefined {
  if (!isRecord(progress)) return undefined
  const current = progress.current
  const target = progress.target ?? progress.total
  if (typeof current !== 'number' || typeof target !== 'number') return undefined
  return { current, target }
}

function fromNimConnectAchievement(raw: {
  appId: string
  achievementId: string
  title: string
  description: string
  rarity: string
  grantedAt: number
  progress?: unknown
}): Achievement | null {
  const progress = mapProgress(raw.progress)
  const envelope = {
    schemaVersion: 1,
    appId: raw.appId,
    achievementId: raw.achievementId,
    title: raw.title,
    description: raw.description,
    ...(raw.rarity ? { rarity: raw.rarity } : {}),
    ...(raw.grantedAt ? { unlockedAt: new Date(raw.grantedAt * 1000).toISOString() } : {}),
    ...(progress ? { progress } : {}),
  }
  const result = validateAchievement(envelope)
  if (!result.ok) return null
  const { schemaVersion: _, ...domain } = result.manifest
  return domain
}
