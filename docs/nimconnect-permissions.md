# NimConnect permissions (Phase 1)

Supported today via `@nimconnect/profile-client`:

- Public handle resolution
- Public profile fields (display name, bio, links)
- `friends:read` — real since profile-client 0.6.0. Requires an authenticated
  NimConnect session (`createSession` → `X-NimConnect-Session`), created with
  the login signature; the Social Club's Connect button is the fallback.
  **Deploy requirement:** NimConnect's session/friends endpoints are POSTs, so
  they answer only origins on its `ALLOWED_ORIGIN` list — NimWorld's deployed
  origin must be added there, or every friends call fails as "Failed to fetch".
  Dev goes through the `/nimconnect-api` Vite proxy to sidestep this.

Not available as production APIs yet — mocked behind adapters:

- `achievements:read`
- `inventory:read`
- `messages:summary`
- `payments:request` (payment flows use Mini App SDK / request links separately)

NimWorld must never assume access to private invoices, full payment history, private messages, savings buckets, or split-bill history.
