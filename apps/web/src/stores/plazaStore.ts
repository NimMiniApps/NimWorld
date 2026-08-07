import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { AppAdapters } from '@/adapters/createAdapters'
import type { CatalogSource } from '@/adapters/catalog/MiniAppCatalogAdapter'
import { fetchWorldConfig, FALLBACK_WORLD_CONFIG, type WorldConfig } from '@/adapters/world/worldConfig'
import { fetchActivityFeed, type ActivityEntry } from '@/adapters/events/activityFeed'
import type { PlazaActor } from '@/adapters/presence/PresenceAdapter'
import { nimToLuna } from '@/adapters/payment/paymentConfig'
import { fetchLiveBalanceNim } from '@/adapters/payment/balanceApi'
import { getResolvedAddress } from '@/auth/session'
import {
  shouldAutoConnectFriends,
  skipAutoConnectFriends,
} from '@/adapters/nimconnect/friendsSession'
import type { AuthorizedApp } from '@/adapters/nimconnect/types'
import {
  loadPlazaPosition,
  savePlazaPosition,
  type LaunchHistoryEntry,
} from '@/adapters/launcher/AppLauncher'
import type {
  ArenaStatus,
  CatalogApp,
  InteractionTarget,
  PublicFriend,
  PublicProfile,
  WorldPosition,
} from '@/domain/types'
import { nimbomberManifest, playnimiqManifest } from '@nimworld/app-manifest'

export type PaymentMode = 'tip' | 'send' | 'request'

export interface PaymentSheetState {
  open: boolean
  mode: PaymentMode
  recipient?: string
  recipientLabel?: string
}

export interface ProfileSheetState {
  address: string
  /** Shown while the lookup runs, and kept if NimConnect knows nothing. */
  fallbackLabel: string
  profile: PublicProfile | null
  loading: boolean
}

const MAX_NIM = 10_000

export const usePlazaStore = defineStore('plaza', () => {
  const profile = ref<PublicProfile | null>(null)
  const interaction = ref<InteractionTarget | null>(null)
  const openLocationId = ref<string | null>(null)
  const featuredApps = ref<CatalogApp[]>([])
  const arcadeApps = ref<CatalogApp[]>([])
  const arenaStatus = ref<ArenaStatus | null>(null)
  const catalogSource = ref<CatalogSource>('fallback')
  const loading = ref(true)
  const error = ref<string | null>(null)
  const lastPosition = ref<WorldPosition | null>(loadPlazaPosition())
  const celebration = ref<string | null>(null)
  const nearbyActors = ref<PlazaActor[]>([])
  const paymentSheet = ref<PaymentSheetState | null>(null)
  const paymentBusy = ref(false)
  const balanceNim = ref<number | null>(null)
  const balanceIsPreview = ref(true)
  const friends = ref<PublicFriend[]>([])
  const friendRequests = ref<PublicFriend[]>([])
  /** False while `friends` is still the mock list. */
  const friendsConnected = ref(false)
  const friendsBusy = ref(false)
  const profileSheet = ref<ProfileSheetState | null>(null)
  const launchHistory = ref<LaunchHistoryEntry[]>([])
  const worldConfig = ref<WorldConfig>(FALLBACK_WORLD_CONFIG)
  /** Cross-app activity, signed by the apps that reported it. */
  const activityFeed = ref<ActivityEntry[]>([])
  /** Live NimConnect grants — drives Arcade Connected badges. */
  const authorizedApps = ref<AuthorizedApp[]>([])
  const authorizedAudiences = computed(
    () => new Set(authorizedApps.value.map((a) => a.audience)),
  )

  let adapters: AppAdapters | null = null

  function setAdapters(next: AppAdapters) {
    adapters = next
  }

  function toast(message: string) {
    celebration.value = message
    window.setTimeout(() => {
      if (celebration.value === message) celebration.value = null
    }, 3200)
  }

  async function bootstrap() {
    if (!adapters) throw new Error('Adapters not set')
    loading.value = true
    error.value = null
    try {
      await Promise.all([
        adapters.nimconnect.initialize(),
        adapters.catalog.initialize(),
        adapters.presence.initialize(),
        adapters.payment.initialize(),
      ])
      profile.value = await adapters.nimconnect.getCurrentProfile()
      featuredApps.value = await adapters.catalog.getFeaturedApps()
      nearbyActors.value = await adapters.presence.getActors()
      launchHistory.value = adapters.launcher.getHistory()
      worldConfig.value = await fetchWorldConfig()
      activityFeed.value = await fetchActivityFeed()
      await loadFriends()
      await autoConnectFriends()
      await refreshBalance()
      const games = await adapters.catalog.getApps()
      const fromCatalog = games.filter((a) =>
        ['nimbomber', 'playnimiq'].includes(a.slug) || a.category.toLowerCase().includes('game'),
      )
      arcadeApps.value =
        fromCatalog.length > 0
          ? fromCatalog
          : [
              {
                id: nimbomberManifest.id,
                slug: nimbomberManifest.id,
                name: nimbomberManifest.name,
                tagline: nimbomberManifest.description,
                category: nimbomberManifest.category,
                iconUrl: nimbomberManifest.iconUrl,
                launchUrl: nimbomberManifest.launchUrl,
                featured: true,
              },
              {
                id: playnimiqManifest.id,
                slug: playnimiqManifest.id,
                name: playnimiqManifest.name,
                tagline: playnimiqManifest.description,
                category: playnimiqManifest.category,
                iconUrl: playnimiqManifest.iconUrl,
                launchUrl: playnimiqManifest.launchUrl,
                featured: true,
              },
            ]
      catalogSource.value = adapters.catalog.getSource()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to bootstrap NimWorld'
    } finally {
      loading.value = false
    }
  }

  function setInteraction(target: InteractionTarget | null) {
    interaction.value = target
  }

  async function openLocation(locationId: string) {
    openLocationId.value = locationId
    if (locationId === 'arena' && adapters) {
      arenaStatus.value = await adapters.arena.getStatus('nimbomber')
    }
    // Fresh on open — a feed is only interesting if it is current.
    if (locationId === 'town-hall') activityFeed.value = await fetchActivityFeed()
  }

  function closeLocation() {
    openLocationId.value = null
  }

  function rememberPosition(position: WorldPosition) {
    lastPosition.value = position
    savePlazaPosition(position)
  }

  async function launchApp(appId: string, launchUrl: string, name?: string) {
    if (!adapters) return
    if (lastPosition.value) savePlazaPosition(lastPosition.value)
    // Tell the plaza before we navigate away, so the ghost we leave behind
    // reads "Playing NimBomber" instead of a bare "Active just now".
    adapters.presence.publishActivity(name ?? appId)
    await adapters.launcher.launch({
      appId,
      launchUrl,
      name,
      returnUrl: `${window.location.origin}${window.location.pathname}`,
      referralSource: 'plaza',
    })
    launchHistory.value = adapters.launcher.getHistory()
  }

  async function refreshAfterReturn(appId?: string) {
    if (!adapters) return
    await adapters.nimconnect.refresh()
    profile.value = await adapters.nimconnect.getCurrentProfile()
    toast(
      appId
        ? `Welcome back from ${appId}. Public profile refreshed.`
        : 'Welcome back. Public profile refreshed.',
    )
  }

  function openPaymentSheet(input: {
    mode: PaymentMode
    recipient?: string
    recipientLabel?: string
  }) {
    if (input.mode === 'tip') {
      paymentSheet.value = {
        open: true,
        mode: 'tip',
        // Server-owned so the jar can move without a client release.
        recipient: worldConfig.value.tipAddress,
        recipientLabel: 'NimWorld tip jar',
      }
      return
    }
    paymentSheet.value = {
      open: true,
      mode: input.mode,
      recipient: input.recipient,
      recipientLabel: input.recipientLabel,
    }
  }

  /** Public profile of another player. Opens immediately, fills in when resolved. */
  async function openProfileSheet(address: string, fallbackLabel: string) {
    if (!adapters || !address) return
    profileSheet.value = { address, fallbackLabel, profile: null, loading: true }
    const resolved = await adapters.nimconnect.getProfile(address)
    // A second profile may have been opened while this lookup was in flight.
    if (profileSheet.value?.address !== address) return
    profileSheet.value = { ...profileSheet.value, profile: resolved, loading: false }
  }

  function closeProfileSheet() {
    profileSheet.value = null
  }

  function closePaymentSheet() {
    if (paymentBusy.value) return
    paymentSheet.value = null
  }

  async function submitPayment(nim: number, message?: string) {
    if (!adapters || !paymentSheet.value?.open) return
    if (!Number.isFinite(nim) || nim <= 0 || nim > MAX_NIM) {
      toast('Enter an amount between 0 and 10,000 NIM.')
      return
    }

    paymentBusy.value = true
    const sheet = paymentSheet.value
    const luna = nimToLuna(nim)
    const note = message?.trim() || undefined

    try {
      if (sheet.mode === 'request') {
        const result = await adapters.payment.requestNim(luna, note)
        if (result.ok) {
          toast(
            sheet.recipientLabel
              ? `Request link ready — send it to ${sheet.recipientLabel}.`
              : 'Request link ready — shared or copied to your clipboard.',
          )
          paymentSheet.value = null
        } else {
          toast(result.reason)
        }
        return
      }

      const recipient = sheet.recipient?.trim()
      if (!recipient) {
        toast('Missing recipient address.')
        return
      }

      const result = await adapters.payment.sendNim(recipient, luna, note)
      if (result.ok) {
        const label = sheet.recipientLabel || 'recipient'
        toast(
          sheet.mode === 'tip'
            ? 'Thanks for tipping NimWorld!'
            : `Sent to ${label}${result.txHash ? ` · ${result.txHash.slice(0, 10)}…` : ''}`,
        )
        paymentSheet.value = null
      } else {
        toast(result.reason)
      }
    } finally {
      paymentBusy.value = false
    }
  }

  async function refreshBalance() {
    if (!adapters) return
    const address = profile.value?.address ?? getResolvedAddress()
    if (address) {
      const live = await fetchLiveBalanceNim(address)
      if (live !== null) {
        balanceNim.value = live
        balanceIsPreview.value = false
        return
      }
    }
    // No session address or RPC unreachable: adapter returns the mock preview amount.
    balanceNim.value = await adapters.payment.getBalanceNim()
    balanceIsPreview.value = true
  }

  async function loadAuthorizedApps() {
    if (!adapters) {
      authorizedApps.value = []
      return
    }
    authorizedApps.value = await adapters.nimconnect.listAuthorizedApps()
  }

  async function loadFriends() {
    if (!adapters) return
    friendsConnected.value = adapters.nimconnect.hasFriendsSession()
    friends.value = await adapters.nimconnect.getFriends()
    friendRequests.value = friendsConnected.value
      ? await adapters.nimconnect.getFriendRequests()
      : []
    await loadAuthorizedApps()
  }

  /**
   * Every friends mutation routes through here so the HUD and the Social Club
   * panel can never disagree about the list. Rethrows so callers can show why.
   */
  async function runFriendAction(action: (a: AppAdapters) => Promise<void>) {
    if (!adapters) return
    friendsBusy.value = true
    try {
      await action(adapters)
      await loadFriends()
    } finally {
      friendsBusy.value = false
    }
  }

  const connectFriends = () => runFriendAction((a) => a.nimconnect.connectFriends())

  /**
   * Restore stored session/grant or request a new v3 authorization.
   * A refusal or network failure is remembered for this load; the Social
   * Club's Connect button remains the way back in.
   */
  async function autoConnectFriends() {
    if (!(await shouldAutoConnectFriends())) return
    skipAutoConnectFriends() // one attempt per load, whatever the outcome
    try {
      await connectFriends()
    } catch {
      // Declined or unreachable: the Social Club's Connect button is the way back.
    }
  }

  const sendFriendRequest = (to: string) =>
    runFriendAction((a) => a.nimconnect.sendFriendRequest(to))
  const acceptFriendRequest = (id: string) =>
    runFriendAction((a) => a.nimconnect.acceptFriendRequest(id))
  const declineFriendRequest = (id: string) =>
    runFriendAction((a) => a.nimconnect.declineFriendRequest(id))
  const removeFriend = (address: string) =>
    runFriendAction((a) => a.nimconnect.removeFriend(address))

  async function openNimConnectProfile(handle?: string) {
    if (!adapters) return
    await adapters.nimconnect.openProfile(handle)
  }

  async function loadFountainExtras(): Promise<{
    achievements: import('@/domain/types').Achievement[]
    inventory: import('@/domain/types').InventoryItem[]
  }> {
    if (!adapters) return { achievements: [], inventory: [] }
    const [achievements, inventory] = await Promise.all([
      adapters.nimconnect.getAchievements(),
      adapters.nimconnect.getInventory(),
    ])
    return { achievements, inventory }
  }

  return {
    profile,
    interaction,
    openLocationId,
    featuredApps,
    arcadeApps,
    arenaStatus,
    catalogSource,
    loading,
    error,
    lastPosition,
    celebration,
    nearbyActors,
    paymentSheet,
    paymentBusy,
    balanceNim,
    balanceIsPreview,
    friends,
    friendRequests,
    friendsConnected,
    friendsBusy,
    profileSheet,
    launchHistory,
    worldConfig,
    activityFeed,
    authorizedApps,
    authorizedAudiences,
    setAdapters,
    bootstrap,
    setInteraction,
    openLocation,
    closeLocation,
    rememberPosition,
    launchApp,
    refreshAfterReturn,
    openPaymentSheet,
    closePaymentSheet,
    openProfileSheet,
    closeProfileSheet,
    submitPayment,
    refreshBalance,
    loadFriends,
    loadAuthorizedApps,
    connectFriends,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    removeFriend,
    openNimConnectProfile,
    loadFountainExtras,
  }
})
