import type { Achievement, AppManifest } from './types'
import { ACHIEVEMENT_RARITIES, SUPPORTED_SCHEMA_VERSIONS } from './types'

export type ManifestValidationResult =
  | { ok: true; manifest: AppManifest }
  | { ok: false; errors: string[] }

export type AchievementValidationResult =
  | { ok: true; manifest: Achievement }
  | { ok: false; errors: string[] }

const ID_PATTERN = /^[a-z0-9-]+$/

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function validateAppManifest(input: unknown): ManifestValidationResult {
  const errors: string[] = []

  if (!isRecord(input)) {
    return { ok: false, errors: ['Manifest must be an object'] }
  }

  const schemaVersion = input.schemaVersion
  if (typeof schemaVersion !== 'number' || !Number.isInteger(schemaVersion)) {
    errors.push('schemaVersion must be an integer')
  } else if (!(SUPPORTED_SCHEMA_VERSIONS as readonly number[]).includes(schemaVersion)) {
    errors.push(
      `Unsupported schemaVersion ${schemaVersion}. Supported: ${SUPPORTED_SCHEMA_VERSIONS.join(', ')}`,
    )
  }

  for (const key of ['id', 'name', 'description', 'category', 'iconUrl', 'launchUrl'] as const) {
    if (typeof input[key] !== 'string' || input[key].trim() === '') {
      errors.push(`${key} must be a non-empty string`)
    }
  }

  if (typeof input.id === 'string' && !ID_PATTERN.test(input.id)) {
    errors.push('id must match [a-z0-9-]+')
  }

  if (input.capabilities !== undefined) {
    if (!Array.isArray(input.capabilities)) {
      errors.push('capabilities must be an array')
    }
  }

  if (input.world !== undefined) {
    if (!isRecord(input.world)) {
      errors.push('world must be an object')
    } else if (typeof input.world.locationType !== 'string') {
      errors.push('world.locationType is required')
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors }
  }

  return { ok: true, manifest: input as unknown as AppManifest }
}

export function assertAppManifest(input: unknown): AppManifest {
  const result = validateAppManifest(input)
  if (!result.ok) {
    throw new Error(`Invalid app manifest: ${result.errors.join('; ')}`)
  }
  return result.manifest
}

export function validateAchievement(input: unknown): AchievementValidationResult {
  const errors: string[] = []

  if (!isRecord(input)) {
    return { ok: false, errors: ['Achievement must be an object'] }
  }

  const schemaVersion = input.schemaVersion
  if (typeof schemaVersion !== 'number' || !Number.isInteger(schemaVersion)) {
    errors.push('schemaVersion must be an integer')
  } else if (!(SUPPORTED_SCHEMA_VERSIONS as readonly number[]).includes(schemaVersion)) {
    errors.push(
      `Unsupported schemaVersion ${schemaVersion}. Supported: ${SUPPORTED_SCHEMA_VERSIONS.join(', ')}`,
    )
  }

  for (const key of ['appId', 'achievementId', 'title', 'description'] as const) {
    if (typeof input[key] !== 'string' || input[key].trim() === '') {
      errors.push(`${key} must be a non-empty string`)
    }
  }

  if (typeof input.appId === 'string' && !ID_PATTERN.test(input.appId)) {
    errors.push('appId must match [a-z0-9-]+')
  }

  if (typeof input.achievementId === 'string' && !ID_PATTERN.test(input.achievementId)) {
    errors.push('achievementId must match [a-z0-9-]+')
  }

  if (input.rarity !== undefined) {
    if (typeof input.rarity !== 'string' || input.rarity.trim() === '') {
      errors.push('rarity must be a non-empty string')
    } else if (!(ACHIEVEMENT_RARITIES as readonly string[]).includes(input.rarity)) {
      errors.push(`rarity must be one of: ${ACHIEVEMENT_RARITIES.join(', ')}`)
    }
  }

  if (input.progress !== undefined) {
    if (!isRecord(input.progress)) {
      errors.push('progress must be an object')
    } else {
      if (typeof input.progress.current !== 'number') {
        errors.push('progress.current must be a number')
      }
      if (typeof input.progress.target !== 'number') {
        errors.push('progress.target must be a number')
      }
    }
  }

  if (input.unlockedAt !== undefined) {
    if (typeof input.unlockedAt !== 'string' || input.unlockedAt.trim() === '') {
      errors.push('unlockedAt must be a non-empty string')
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors }
  }

  return { ok: true, manifest: input as unknown as Achievement }
}

export function assertAchievement(input: unknown): Achievement {
  const result = validateAchievement(input)
  if (!result.ok) {
    throw new Error(`Invalid achievement: ${result.errors.join('; ')}`)
  }
  return result.manifest
}
