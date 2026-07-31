import type { AppManifest } from './types'

export const nimbomberManifest: AppManifest = {
  schemaVersion: 1,
  id: 'nimbomber',
  name: 'NimBomber',
  description: 'Fast arcade battles powered by Nimiq.',
  category: 'game',
  iconUrl: 'https://nimbomber.nimiqminiapps.com/icons/icon-512.png',
  launchUrl: 'https://nimbomber.nimiqminiapps.com',
  capabilities: ['identity', 'achievements', 'stats', 'leaderboards', 'challenges'],
  nimconnect: {
    minimumSdkVersion: '0.1.0',
    requestedScopes: ['profile:read', 'achievements:read', 'friends:read'],
  },
  world: {
    locationType: 'arena',
    district: 'games',
    interactionLabel: 'Enter Arena',
    featured: true,
    statusProvider: 'nimbomber',
  },
}

export const playnimiqManifest: AppManifest = {
  schemaVersion: 1,
  id: 'playnimiq',
  name: 'PlayNimiq',
  description: 'Skill-based games with Nimiq wallet identity and rewards.',
  category: 'game',
  iconUrl: 'https://playnimiq.com/images/nimiq-2048-game-logo.png',
  launchUrl: 'https://playnimiq.com',
  capabilities: ['identity', 'stats', 'leaderboards', 'challenges'],
  nimconnect: {
    requestedScopes: ['profile:read'],
  },
  world: {
    locationType: 'arcade',
    district: 'games',
    interactionLabel: 'Open Arcade',
    featured: true,
  },
}

export const mockManifests: AppManifest[] = [nimbomberManifest, playnimiqManifest]
