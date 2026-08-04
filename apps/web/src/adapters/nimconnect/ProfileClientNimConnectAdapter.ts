import { createProfileClient } from '@nimconnect/profile-client'
import type {
  Achievement,
  InventoryItem,
  NimConnectScope,
  PublicFriend,
  PublicProfile,
} from '@/domain/types'
import { identiconDataUrl } from '@/lib/identicon'
import {
  MOCK_ACHIEVEMENTS,
  MOCK_FRIENDS,
  MOCK_INVENTORY,
  MOCK_PROFILE,
} from './mockData'
import type { NimConnectAdapter, PermissionResult } from './types'

/**
 * Uses real @nimconnect/profile-client for public profile/handle lookup.
 * Friends, achievements, and inventory remain clearly labelled mocks until
 * NimConnect exposes production APIs for those capabilities.
 */
export class ProfileClientNimConnectAdapter implements NimConnectAdapter {
  private client = createProfileClient()
  private address: string | null = null
  private cachedProfile: PublicProfile | null = null

  constructor(private readonly fallbackAddress?: string) {}

  setAddress(address: string | null) {
    this.address = address
  }

  async initialize(): Promise<void> {
    const address = this.address ?? this.fallbackAddress ?? null
    if (!address) {
      this.cachedProfile = await withIdenticon({ ...MOCK_PROFILE, source: 'mock' })
      return
    }

    try {
      const identity = await this.client.getDisplayIdentity(address)
      this.cachedProfile = await withIdenticon({
        address: identity.address,
        handle: identity.handle,
        displayName: identity.displayName,
        bio: identity.bio,
        source: 'nimconnect',
      })
    } catch {
      this.cachedProfile = await withIdenticon({
        ...MOCK_PROFILE,
        address,
        source: 'mock',
      })
    }
  }

  async getCurrentProfile(): Promise<PublicProfile | null> {
    if (!this.cachedProfile) await this.initialize()
    return this.cachedProfile
  }

  async getFriends(): Promise<PublicFriend[]> {
    return MOCK_FRIENDS.map((f) => ({ ...f }))
  }

  async getAchievements(appId?: string): Promise<Achievement[]> {
    return MOCK_ACHIEVEMENTS.filter((a) => !appId || a.appId === appId).map((a) => ({ ...a }))
  }

  async getInventory(appId?: string): Promise<InventoryItem[]> {
    return MOCK_INVENTORY.filter((i) => !appId || i.appId === appId || !i.appId).map((i) => ({
      ...i,
    }))
  }

  async requestScopes(scopes: NimConnectScope[]): Promise<PermissionResult> {
    const supported: NimConnectScope[] = ['profile:read']
    const granted = scopes.filter((s) => supported.includes(s))
    const denied = scopes.filter((s) => !supported.includes(s))
    return {
      granted,
      denied,
      note:
        denied.length > 0
          ? 'Friends, achievements, inventory, and messaging scopes are not available from NimConnect yet. Mock data is used instead.'
          : undefined,
    }
  }

  async openProfile(handle?: string): Promise<void> {
    const target = handle ?? this.cachedProfile?.handle
    if (!target) return
    window.open(`https://nimconnect.nimiqminiapps.com/@${target}`, '_blank', 'noopener,noreferrer')
  }

  async refresh(): Promise<void> {
    await this.initialize()
  }
}

async function withIdenticon(profile: PublicProfile): Promise<PublicProfile> {
  try {
    return { ...profile, avatarDataUrl: await identiconDataUrl(profile.address) }
  } catch {
    return profile
  }
}
