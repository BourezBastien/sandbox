import { createAuthClient } from "better-auth/react"
import { adminClient, usernameClient } from "better-auth/client/plugins"

/**
 * The browser-side twin of `@/lib/auth` - sign-in, sign-out and session reads
 * from client components. Server-side mutations (creating accounts, banning)
 * go through server actions calling `auth.api` instead, where the caller's
 * headers let the admin plugin check who is asking.
 */
export const authClient = createAuthClient({
  plugins: [usernameClient(), adminClient()],
})
