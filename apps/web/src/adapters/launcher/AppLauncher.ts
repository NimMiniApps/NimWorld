import { isNimiqPayHost } from '@/auth/session'

export interface LaunchContext {
  appId: string
  launchUrl: string
  /** Display name for the history list; falls back to the appId. */
  name?: string
  returnUrl?: string
  challengeId?: string
  referralSource?: string
}

export interface LaunchHistoryEntry {
  appId: string
  name: string
  launchUrl: string
  /** Epoch ms of the most recent launch. */
  launchedAt: number
}

export interface AppLauncher {
  launch(context: LaunchContext): Promise<void>
  getLastLaunch(): LaunchContext | null
  /** Most recent first, one entry per app. */
  getHistory(): LaunchHistoryEntry[]
}

const STORAGE_KEY = 'nimworld:last-launch'
const POSITION_KEY = 'nimworld:last-position'
const HISTORY_KEY = 'nimworld:launch-history'
const HISTORY_MAX = 8

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

/** Stable plaza return URL: origin + pathname + `returnedFrom=<appId>` (no leftover query junk). */
export function buildReturnUrl(base: string, appId: string): string {
  const url = new URL(base, typeof window !== 'undefined' ? window.location.origin : 'https://nimworld.local')
  url.search = ''
  url.hash = ''
  url.searchParams.set('returnedFrom', appId)
  return url.toString()
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

    const returnBase =
      context.returnUrl ??
      (typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : '/')
    const returnUrl = buildReturnUrl(returnBase, context.appId)

    // Safe public context only — never private profile fields.
    url.searchParams.set('source', 'nimworld')
    url.searchParams.set('returnUrl', returnUrl)
    if (context.challengeId) url.searchParams.set('challengeId', context.challengeId)
    if (context.referralSource) url.searchParams.set('ref', context.referralSource)

    this.last = { ...context, returnUrl }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(this.last))
    this.record(context)

    const target = url.toString()
    if (isNimiqPayHost()) {
      window.location.assign(target)
    } else {
      window.open(target, '_blank', 'noopener,noreferrer')
    }
  }

  getLastLaunch(): LaunchContext | null {
    return this.last
  }

  // localStorage, not sessionStorage: "recently played" is worth nothing if it
  // dies with the tab, and none of it is private — appId, name, launch URL.
  getHistory(): LaunchHistoryEntry[] {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (!raw) return []
    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? (parsed as LaunchHistoryEntry[]) : []
    } catch {
      return []
    }
  }

  private record(context: LaunchContext) {
    const entry: LaunchHistoryEntry = {
      appId: context.appId,
      name: context.name || context.appId,
      launchUrl: context.launchUrl,
      launchedAt: Date.now(),
    }
    const next = [entry, ...this.getHistory().filter((e) => e.appId !== entry.appId)].slice(
      0,
      HISTORY_MAX,
    )
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
    } catch {
      /* best-effort — a full or blocked store must not break the launch */
    }
  }
}
