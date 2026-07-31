import type { ArenaStatus } from '@/domain/types'

export interface ArenaStatusAdapter {
  getStatus(appId: string): Promise<ArenaStatus>
}

export class MockArenaStatusAdapter implements ArenaStatusAdapter {
  async getStatus(appId: string): Promise<ArenaStatus> {
    return {
      appId,
      dailyChallenge: {
        title: 'Win 3 matches today',
        progressLabel: '1 / 3 completed',
        completed: false,
      },
      weeklyTournament: {
        title: 'Bomber Cup',
        statusLabel: 'Open — ends in 2 days',
      },
      stats: [
        { label: 'Wins', value: 14 },
        { label: 'Best streak', value: 4 },
        { label: 'Matches', value: 37 },
      ],
      recentPlayers: [
        { handle: 'nova', statusLabel: 'Played 18 min ago' },
        { handle: 'luna', statusLabel: 'Played yesterday' },
      ],
      leaderboardPreview: [
        { rank: 1, handle: 'blaze', score: 1280 },
        { rank: 2, handle: 'nova', score: 1104 },
        { rank: 3, handle: 'maestro', score: 980 },
      ],
      source: 'mock',
    }
  }
}
