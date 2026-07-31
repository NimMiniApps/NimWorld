# App manifest

Versioned schema for Mini Apps consumed by NimWorld (and potentially NimConnect / NimiqMiniApps).

- TypeScript types: `packages/app-manifest/src/types.ts`
- JSON Schema: `packages/app-manifest/src/schema.json`
- Validation: `validateAppManifest()`
- Unsupported `schemaVersion` values fail with a clear error list

App-specific fields belong under `extensions` or namespaced keys — keep the core envelope stable.
