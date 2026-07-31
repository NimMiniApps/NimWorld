export interface WorldPosition {
  x: number
  y: number
}

export type PresenceKind = 'self' | 'online' | 'ghost' | 'npc'

export interface InteractionTarget {
  locationId: string
  label: string
  kind: string
}

export type WorldEvent =
  | { type: 'INTERACTION_AVAILABLE'; target: InteractionTarget }
  | { type: 'INTERACTION_CLEARED' }
  | { type: 'OPEN_LOCATION'; locationId: string }
  | { type: 'PLAYER_MOVED'; position: WorldPosition }
  | { type: 'PLAYER_READY'; position: WorldPosition }
  | { type: 'RETURNED_FROM_APP'; appId: string }

export type UiCommand =
  | { type: 'PAUSE_MOVEMENT' }
  | { type: 'RESUME_MOVEMENT' }
  | { type: 'RESTORE_POSITION'; position: WorldPosition }
  | { type: 'SET_INPUT_VECTOR'; x: number; y: number }
  | { type: 'TRIGGER_INTERACT' }

export interface PublicProfile {
  address: string
  handle?: string
  displayName?: string
  bio?: string
  avatarDataUrl?: string
  source: 'nimconnect' | 'mock'
}

export interface PublicFriend {
  handle: string
  displayName: string
  statusLabel: string
  presence: PresenceKind
}

export interface Achievement {
  appId: string
  achievementId: string
  title: string
  description: string
  iconUrl?: string
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
  unlockedAt?: string
  progress?: { current: number; target: number }
}

export interface InventoryItem {
  namespace: string
  itemId: string
  appId?: string
  name: string
  description?: string
  iconUrl?: string
  quantity: number
  rarity?: string
  portability: 'shared' | 'app-local'
  usableIn?: string[]
  tradable: boolean
}

export interface CatalogApp {
  id: string
  slug: string
  name: string
  tagline?: string
  category: string
  iconUrl?: string
  launchUrl: string
  featured: boolean
  openUrl?: string
}

export interface ArenaStatus {
  appId: string
  dailyChallenge: {
    title: string
    progressLabel: string
    completed: boolean
  }
  weeklyTournament: {
    title: string
    statusLabel: string
  }
  stats: Array<{ label: string; value: string | number }>
  recentPlayers: Array<{ handle: string; statusLabel: string }>
  leaderboardPreview: Array<{ rank: number; handle: string; score: number }>
  source: 'live' | 'mock'
}

export type NimConnectScope =
  | 'profile:read'
  | 'friends:read'
  | 'achievements:read'
  | 'inventory:read'
  | 'messages:summary'
  | 'payments:request'
