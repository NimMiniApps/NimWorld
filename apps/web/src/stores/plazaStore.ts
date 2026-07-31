import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { AppAdapters } from '@/adapters/createAdapters'
import type { ArenaStatus, CatalogApp, InteractionTarget, PublicProfile, WorldPosition } from '@/domain/types'
import { loadPlazaPosition, savePlazaPosition } from '@/adapters/launcher/AppLauncher'
import { nimbomberManifest, playnimiqManifest } from '@nimworld/app-manifest'

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

  let adapters: AppAdapters | null = null

  function setAdapters(next: AppAdapters) {
    adapters = next
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
      returnUrl: window.location.href,
      referralSource: 'plaza',
    })
  }

  async function refreshAfterReturn(appId?: string) {
    if (!adapters) return
    await adapters.nimconnect.refresh()
    profile.value = await adapters.nimconnect.getCurrentProfile()
    celebration.value = appId
      ? `Welcome back from ${appId}. Public profile refreshed.`
      : 'Welcome back. Public profile refreshed.'
    window.setTimeout(() => {
      celebration.value = null
    }, 3200)
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
    setAdapters,
    bootstrap,
    setInteraction,
    openLocation,
    closeLocation,
    rememberPosition,
    launchApp,
    refreshAfterReturn,
  }
})
