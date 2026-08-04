/// <reference types="vite/client" />

/** Injected by vite.config.ts — git short hash or NIMWORLD_BUILD_ID. */
declare const __BUILD_ID__: string

interface ImportMetaEnv {
  readonly VITE_NIMIQ_HUB_URL?: string
  readonly VITE_NIMCONNECT_API?: string
  readonly VITE_MINIAPPS_API?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '@nimiq/identicons/dist/identicons.bundle.min.js' {
  const Identicons: {
    toDataUrl(address: string): Promise<string>
    placeholderToDataUrl(color?: string, strokeWidth?: number): string
  }
  export default Identicons
}
