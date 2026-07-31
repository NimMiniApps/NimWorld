import type { Achievement, InventoryItem, PublicFriend, PublicProfile } from '@/domain/types'

/** Clearly labelled local mock identity — replaceable via adapter swap. */
export const MOCK_PROFILE: PublicProfile = {
  address: 'NQ17 VERV F3MQ 283T NRSR FPJG 55BJ PMHC N8MD',
  handle: 'maestro',
  displayName: 'Maestro',
  bio: 'Exploring the NimWorld plaza (mock identity).',
  source: 'mock',
}

export const MOCK_FRIENDS: PublicFriend[] = [
  {
    handle: 'luna',
    displayName: 'Luna',
    statusLabel: 'Active 12 minutes ago',
    presence: 'ghost',
  },
  {
    handle: 'pixel',
    displayName: 'Pixel',
    statusLabel: 'Recently visited',
    presence: 'ghost',
  },
  {
    handle: 'nova',
    displayName: 'Nova',
    statusLabel: 'Playing NimBomber',
    presence: 'ghost',
  },
]

export const MOCK_ACHIEVEMENTS: Achievement[] = [
  {
    appId: 'nimbomber',
    achievementId: 'first-blast',
    title: 'First Blast',
    description: 'Win your first NimBomber match.',
    rarity: 'common',
    unlockedAt: '2026-07-20T12:00:00Z',
  },
  {
    appId: 'playnimiq',
    achievementId: 'snake-100',
    title: 'Snake Streak',
    description: 'Score 100 in Snake.',
    rarity: 'uncommon',
    progress: { current: 72, target: 100 },
  },
]

export const MOCK_INVENTORY: InventoryItem[] = [
  {
    namespace: 'nimbomber',
    itemId: 'golden-bomb',
    appId: 'nimbomber',
    name: 'Golden Bomb',
    description: 'Cosmetic bomb skin.',
    quantity: 1,
    rarity: 'rare',
    portability: 'app-local',
    usableIn: ['nimbomber'],
    tradable: false,
  },
  {
    namespace: 'nimconnect',
    itemId: 'founder-frame',
    name: 'Founder Frame',
    description: 'Shared profile frame.',
    quantity: 1,
    rarity: 'epic',
    portability: 'shared',
    tradable: false,
  },
]
