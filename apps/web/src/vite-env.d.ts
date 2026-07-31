/// <reference types="vite/client" />

declare module '@nimiq/identicons' {
  const Identicons: {
    svg(address: string): Promise<string>
  }
  export default Identicons
}
