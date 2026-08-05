export const NIMCONNECT_WEB_URL = 'https://nimconnect.nimiqminiapps.com'

/** Without a handle there is no profile to show — send people to claim one instead. */
export function nimconnectProfileUrl(handle?: string): string {
  return handle ? `${NIMCONNECT_WEB_URL}/@${handle}` : NIMCONNECT_WEB_URL
}

export function openNimconnect(handle?: string): void {
  window.open(nimconnectProfileUrl(handle), '_blank', 'noopener,noreferrer')
}
