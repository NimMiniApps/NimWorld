import type { AppManifest } from './types'
import nimbomber from './manifests/nimbomber.json'
import playnimiq from './manifests/playnimiq.json'

// One source of truth: these JSON files are what the Go API serves from /apps
// too, so a manifest fix never has to be made twice. The casts are kept honest
// by validate.test.ts, which runs the real validator over both.
export const nimbomberManifest = nimbomber as AppManifest
export const playnimiqManifest = playnimiq as AppManifest

export const mockManifests: AppManifest[] = [nimbomberManifest, playnimiqManifest]
