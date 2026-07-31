export interface LaunchContext {
  appId: string
  launchUrl: string
  returnUrl?: string
  challengeId?: string
  referralSource?: string
}

export interface AppLauncher {
  launch(context: LaunchContext): Promise<void>
  getLastLaunch(): LaunchContext | null
}

const STORAGE_KEY = 'nimworld:last-launch'
const POSITION_KEY = 'nimworld:last-position'

export function savePlazaPosition(position: { x: number; y: number }) {
  sessionStorage.setItem(POSITION_KEY, JSON.stringify(position))
}

export function loadPlazaPosition(): { x: number; y: number } | null {
  const raw = sessionStorage.getItem(POSITION_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as { x: number; y: number }
  } catch {
    return null
  }
}

export class BrowserAppLauncher implements AppLauncher {
  private last: LaunchContext | null = null

  constructor() {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (raw) {
      try {
        this.last = JSON.parse(raw) as LaunchContext
      } catch {
        this.last = null
      }
    }
  }

  async launch(context: LaunchContext): Promise<void> {
    let url: URL
    try {
      url = new URL(context.launchUrl)
    } catch {
      throw new Error('Invalid launch URL')
    }

    // Safe public context only — never private profile fields.
    url.searchParams.set('source', 'nimworld')
    url.searchParams.set('returnUrl', context.returnUrl ?? window.location.href)
    if (context.challengeId) url.searchParams.set('challengeId', context.challengeId)
    if (context.referralSource) url.searchParams.set('ref', context.referralSource)

    this.last = context
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(context))
    window.open(url.toString(), '_blank', 'noopener,noreferrer')
  }

  getLastLaunch(): LaunchContext | null {
    return this.last
  }
}
