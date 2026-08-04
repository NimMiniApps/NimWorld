import { HttpMiniAppCatalogAdapter } from '@/adapters/catalog/MiniAppCatalogAdapter'
import { MockArenaStatusAdapter } from '@/adapters/arena/ArenaStatusAdapter'
import { BrowserAppLauncher } from '@/adapters/launcher/AppLauncher'
import { ProfileClientNimConnectAdapter } from '@/adapters/nimconnect/ProfileClientNimConnectAdapter'
import { MiniAppSdkPaymentAdapter } from '@/adapters/payment/NimiqPaymentAdapter'
import { loadPlazaPosition } from '@/adapters/launcher/AppLauncher'
import { LocalPresenceAdapter } from '@/adapters/presence/PresenceAdapter'
import {
  RealtimePresenceAdapter,
  presenceWsUrl,
} from '@/adapters/presence/RealtimePresenceAdapter'
import { getResolvedAddress } from '@/auth/session'

export function createAdapters() {
  const address = getResolvedAddress()
  const nimconnect = new ProfileClientNimConnectAdapter(address ?? undefined)
  const catalog = new HttpMiniAppCatalogAdapter()
  const launcher = new BrowserAppLauncher()
  const arena = new MockArenaStatusAdapter()
  // Only the plaza canvas should open a live presence socket. Other callers
  // (overlays) get local actors so we don't open duplicate WS sessions.
  const presence = new LocalPresenceAdapter()
  const payment = new MiniAppSdkPaymentAdapter()

  return { nimconnect, catalog, launcher, arena, presence, payment }
}

/** Presence wired for the main plaza canvas (one live socket per session). */
export function createPlazaPresenceAdapter(label?: string) {
  const address = getResolvedAddress()
  if (!address) return new LocalPresenceAdapter()
  return new RealtimePresenceAdapter({
    local: new LocalPresenceAdapter(),
    wsUrl: presenceWsUrl(),
    label: label?.trim() || shortLabel(address),
    spawn: loadPlazaPosition() ?? undefined,
  })
}

function shortLabel(address: string): string {
  const compact = address.replace(/\s+/g, '')
  return compact.length <= 10 ? compact : `${compact.slice(0, 8)}…`
}

export type AppAdapters = ReturnType<typeof createAdapters>
