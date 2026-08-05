export const PREVIEW_NIM_BALANCE = 1250.45

export const PREVIEW_PROFILE_STATS = {
  level: 42,
  xp: 8420,
  xpMax: 12500,
  trophies: 184,
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
