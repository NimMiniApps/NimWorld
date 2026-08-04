export const PREVIEW_NIM_BALANCE = '1,250.45'

export const PREVIEW_CHAT = {
  tabs: ['World', 'Friends', 'Nearby'] as const,
  messages: [
    { user: '@alice', text: 'Anyone up for NimBomber?' },
    { user: '@bob', text: 'Fountain looking good today' },
    { user: '@carol', text: 'Meet at the Arcade in 5' },
  ],
}

export const PREVIEW_FRIENDS = [
  { handle: '@alice', place: 'In Plaza', online: true },
  { handle: '@bob', place: 'In Arcade', online: true },
  { handle: '@dana', place: 'Offline', online: false },
]

export const PREVIEW_EVENTS = [
  { title: 'Bomber Tournament', time: '18:00 UTC' },
  { title: 'Plaza Meetup', time: '20:00 UTC' },
  { title: 'Dev Showcase', time: '22:30 UTC' },
]
