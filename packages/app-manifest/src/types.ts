export type AppCapability =
  | 'identity'
  | 'achievements'
  | 'stats'
  | 'leaderboards'
  | 'challenges'
  | 'inventory'

export type NimConnectScope =
  | 'profile:read'
  | 'friends:read'
  | 'achievements:read'
  | 'inventory:read'
  | 'messages:summary'
  | 'payments:request'

export type WorldLocationType =
  | 'fountain'
  | 'arena'
  | 'arcade'
  | 'town-hall'
  | 'social-club'
  | 'marketplace'
  | 'quest-board'
  | 'portal'

export interface AppManifestNimConnect {
  minimumSdkVersion?: string
  requestedScopes?: NimConnectScope[]
}

export interface AppManifestWorld {
  locationType: WorldLocationType
  district?: string
  interactionLabel?: string
  featured?: boolean
  statusProvider?: string
}

export interface AppManifest {
  schemaVersion: number
  id: string
  name: string
  description: string
  category: string
  iconUrl: string
  launchUrl: string
  capabilities?: AppCapability[]
  nimconnect?: AppManifestNimConnect
  world?: AppManifestWorld
  /** App-owned opaque fields stay namespaced. */
  extensions?: Record<string, unknown>
}

export type AchievementRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'

export interface Achievement {
  schemaVersion: number
  appId: string
  achievementId: string
  title: string
  description: string
  iconUrl?: string
  rarity?: AchievementRarity
  unlockedAt?: string
  progress?: { current: number; target: number }
}

export const ACHIEVEMENT_RARITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary'] as const

export const SUPPORTED_SCHEMA_VERSIONS = [1] as const
