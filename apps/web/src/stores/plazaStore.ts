import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { AppAdapters } from '@/adapters/createAdapters'
import type { PlazaActor } from '@/adapters/presence/PresenceAdapter'
import { NIMWORLD_TIP_ADDRESS, nimToLuna } from '@/adapters/payment/paymentConfig'
import { loadPlazaPosition, savePlazaPosition } from '@/adapters/launcher/AppLauncher'
import type { ArenaStatus, CatalogApp, InteractionTarget, PublicProfile, WorldPosition } from '@/domain/types'
import { nimbomberManifest, playnimiqManifest } from '@nimworld/app-manifest'

export type PaymentMode = 'tip' | 'send' | 'request'

export interface PaymentSheetState {
  open: boolean
  mode: PaymentMode
  recipient?: string
  recipientLabel?: string
}

const MAX_NIM = 10_000

export const usePlazaStore = defineStore('plaza', () => {
  const profile = ref<PublicProfile | null>(null)
  const interaction = ref<InteractionTarget | null>(null)
  const openLocationId = ref<string | null>(null)
  const featuredApps = ref<CatalogApp[]>([])
  const arcadeApps = ref<CatalogApp[]>([])
  const arenaStatus = ref<ArenaStatus | null>(null)
  const catalogSource = ref<'live' | 'fallback'>('fallback')
  const loading = ref(true)
  const error = ref<string | null>(null)
  const lastPosition = ref<WorldPosition | null>(loadPlazaPosition())
  const celebration = ref<string | null>(null)
  const nearbyActors = ref<PlazaActor[]>([])
  const paymentSheet = ref<PaymentSheetState | null>(null)
  const paymentBusy = ref(false)

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
  }

  function closeLocation() {
    openLocationId.value = null
  }

  function rememberPosition(position: WorldPosition) {
    lastPosition.value = position
    savePlazaPosition(position)
  }

  async function launchApp(appId: string, launchUrl: string) {
    if (!adapters) return
    if (lastPosition.value) savePlazaPosition(lastPosition.value)
    await adapters.launcher.launch({
      appId,
      launchUrl,
      returnUrl: `${window.location.origin}${window.location.pathname}`,
      referralSource: 'plaza',
    })
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
        recipient: NIMWORLD_TIP_ADDRESS,
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
          toast('Request link copied to clipboard.')
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
    submitPayment,
    openNimConnectProfile,
    loadFountainExtras,
  }
})
