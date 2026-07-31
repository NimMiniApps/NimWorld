import type {
  Achievement,
  InventoryItem,
  NimConnectScope,
  PublicFriend,
  PublicProfile,
} from '@/domain/types'
import type { NimConnectAdapter, PermissionResult } from './types'
import {
  MOCK_ACHIEVEMENTS,
  MOCK_FRIENDS,
  MOCK_INVENTORY,
  MOCK_PROFILE,
} from './mockData'

export class MockNimConnectAdapter implements NimConnectAdapter {
  private profile: PublicProfile = { ...MOCK_PROFILE }

  async initialize(): Promise<void> {
    // no-op
  }

  async getCurrentProfile(): Promise<PublicProfile | null> {
    return { ...this.profile, source: 'mock' }
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
    return {
      granted: scopes,
      denied: [],
      note: 'Mock adapter grants all requested scopes locally. Not a real NimConnect permission.',
    }
  }

  async openProfile(handle?: string): Promise<void> {
    const target = handle ?? this.profile.handle
    if (!target) return
    window.open(`https://nimconnect.nimiqminiapps.com/@${target}`, '_blank', 'noopener,noreferrer')
  }

  async refresh(): Promise<void> {
    // mock has nothing to refresh
  }
}
