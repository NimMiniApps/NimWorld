export const PREVIEW_NIM_BALANCE = 1250.45

export const PREVIEW_PROFILE_STATS = {
  level: 42,
  xp: 8420,
  xpMax: 12500,
  trophies: 184,
  friends: 31,
  apps: 8,
}

export const PREVIEW_CHAT = {
  tabs: ['World', 'Friends', 'Nearby'] as const,
  messages: [
    { user: '@alice', text: 'Anyone up for NimBomber?' },
    { user: '@bob', text: 'Fountain looking good today' },
    { user: '@carol', text: 'Meet at the Arcade in 5' },
  ],
}

/** Mock friend rows with addresses so Nimiq identicons render. */
export const PREVIEW_FRIENDS = [
  {
    handle: '@alice',
    place: 'In Plaza',
    online: true,
    address: 'NQ55 V5L7 A1PQ KX5P 7N3J 3M8R 9TQW 2H4Y 6Z1C',
  },
  {
    handle: '@bob',
    place: 'In Arcade',
    online: true,
    address: 'NQ72 B8MD 3K9F R2HW 6P1N 4T7X 0J5Q 8Y3A 9C6E',
  },
  {
    handle: '@dana',
    place: 'Offline',
    online: false,
    address: 'NQ19 G4HS 7M2K 5W8P 1R6T 3Y9A 0C4E 8J7N 2X5Q',
  },
]

export const PREVIEW_EVENTS = [
  { title: 'Bomber Tournament', time: '18:00 UTC' },
  { title: 'Plaza Meetup', time: '20:00 UTC' },
  { title: 'Dev Showcase', time: '22:30 UTC' },
]

/** HUD icon paths under /assets/art/ui/hud/ */
export const HUD_ICON = {
  home: '/assets/art/ui/hud/icon_home_v01.png',
  apps: '/assets/art/ui/hud/icon_apps_v01.png',
  inventory: '/assets/art/ui/hud/icon_inventory_v01.png',
  achievements: '/assets/art/ui/hud/icon_achievements_v01.png',
  friends: '/assets/art/ui/hud/icon_friends_v01.png',
  wallet: '/assets/art/ui/hud/icon_wallet_v01.png',
  coin: '/assets/art/ui/hud/icon_coin_v01.png',
} as const

export function formatNim(amount: number): string {
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}
