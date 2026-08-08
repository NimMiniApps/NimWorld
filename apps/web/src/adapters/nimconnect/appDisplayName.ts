/** Prefer registered → authorized → catalog → raw slug. Never invent a pretty name. */
export function pickAppDisplayName(input: {
  appId: string
  registeredName?: string | null
  authorizedName?: string | null
  catalogName?: string | null
}): string {
  const registered = input.registeredName?.trim()
  if (registered) return registered
  const authorized = input.authorizedName?.trim()
  if (authorized) return authorized
  const catalog = input.catalogName?.trim()
  if (catalog) return catalog
  return input.appId
}
