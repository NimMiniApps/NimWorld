import type { CatalogApp } from '@/domain/types'
import { mockManifests } from '@nimworld/app-manifest'

export interface MiniAppCatalogAdapter {
  initialize(): Promise<void>
  getFeaturedApps(): Promise<CatalogApp[]>
  getApps(query?: string): Promise<CatalogApp[]>
  resolveLaunchUrl(appIdOrSlug: string): Promise<string | null>
}

interface ApiApp {
  id: string
  slug: string
  name: string
  tagline?: string
  category: string
  icon_url?: string | null
  website_url?: string | null
  featured?: boolean
  open_url?: string
}

function mapApiApp(app: ApiApp): CatalogApp {
  return {
    id: app.id,
    slug: app.slug,
    name: app.name,
    tagline: app.tagline,
    category: app.category,
    iconUrl: app.icon_url ?? undefined,
    launchUrl: app.website_url || app.open_url || `https://${app.slug}`,
    featured: Boolean(app.featured),
    openUrl: app.open_url,
  }
}

function manifestFallback(): CatalogApp[] {
  return mockManifests.map((m) => ({
    id: m.id,
    slug: m.id,
    name: m.name,
    tagline: m.description,
    category: m.category,
    iconUrl: m.iconUrl,
    launchUrl: m.launchUrl,
    featured: Boolean(m.world?.featured),
  }))
}

export class HttpMiniAppCatalogAdapter implements MiniAppCatalogAdapter {
  private cache: CatalogApp[] = []
  private source: 'live' | 'fallback' = 'fallback'

  constructor(private readonly baseUrl = '/catalog-api') {}

  getSource() {
    return this.source
  }

  async initialize(): Promise<void> {
    try {
      const res = await fetch(`${this.baseUrl}/api/apps?featured=true&status=approved`)
      if (!res.ok) throw new Error(`catalog ${res.status}`)
      const data = (await res.json()) as ApiApp[] | { apps: ApiApp[] }
      const list = Array.isArray(data) ? data : data.apps
      this.cache = list.map(mapApiApp)
      this.source = 'live'
    } catch {
      this.cache = manifestFallback()
      this.source = 'fallback'
    }
  }

  async getFeaturedApps(): Promise<CatalogApp[]> {
    if (!this.cache.length) await this.initialize()
    const featured = this.cache.filter((a) => a.featured)
    return featured.length ? featured : this.cache.slice(0, 6)
  }

  async getApps(query?: string): Promise<CatalogApp[]> {
    if (!this.cache.length) await this.initialize()
    if (!query?.trim()) return [...this.cache]
    const q = query.trim().toLowerCase()
    return this.cache.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.slug.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q),
    )
  }

  async resolveLaunchUrl(appIdOrSlug: string): Promise<string | null> {
    if (!this.cache.length) await this.initialize()
    const app = this.cache.find((a) => a.slug === appIdOrSlug || a.id === appIdOrSlug)
    return app?.launchUrl ?? null
  }
}
