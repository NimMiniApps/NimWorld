import type { AppManifest } from './types'
import { SUPPORTED_SCHEMA_VERSIONS } from './types'

export type ManifestValidationResult =
  | { ok: true; manifest: AppManifest }
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
