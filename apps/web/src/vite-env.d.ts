/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_NIMIQ_HUB_URL?: string
  readonly VITE_NIMCONNECT_API?: string
  readonly VITE_MINIAPPS_API?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '@nimiq/identicons' {
  const Identicons: {
    svg(address: string): Promise<string>
  }
  export default Identicons
}
