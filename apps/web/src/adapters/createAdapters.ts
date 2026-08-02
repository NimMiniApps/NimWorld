import { HttpMiniAppCatalogAdapter } from '@/adapters/catalog/MiniAppCatalogAdapter'
import { MockArenaStatusAdapter } from '@/adapters/arena/ArenaStatusAdapter'
import { BrowserAppLauncher } from '@/adapters/launcher/AppLauncher'
import { ProfileClientNimConnectAdapter } from '@/adapters/nimconnect/ProfileClientNimConnectAdapter'
import { MiniAppSdkPaymentAdapter } from '@/adapters/payment/NimiqPaymentAdapter'
import { LocalPresenceAdapter } from '@/adapters/presence/PresenceAdapter'
import { getResolvedAddress } from '@/auth/session'

export function createAdapters() {
  const nimconnect = new ProfileClientNimConnectAdapter(getResolvedAddress() ?? undefined)
  const catalog = new HttpMiniAppCatalogAdapter()
  const launcher = new BrowserAppLauncher()
  const arena = new MockArenaStatusAdapter()
  const presence = new LocalPresenceAdapter()
  const payment = new MiniAppSdkPaymentAdapter()

  return { nimconnect, catalog, launcher, arena, presence, payment }
}

export type AppAdapters = ReturnType<typeof createAdapters>
