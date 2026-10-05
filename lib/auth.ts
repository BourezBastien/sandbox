import "server-only"

import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { admin } from "better-auth/plugins/admin"
import { username } from "better-auth/plugins/username"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { db } from "@/lib/db"
import { account, session, user, verification } from "@/lib/db"

/**
 * Better Auth, configured for a school deployment: username + password
 * accounts, created by an admin (or by the /install bootstrap for the very
 * first one), no self sign-up, no emails.
 *
 * Key choices, and why:
 *
 * - `disableSignUp` - the public sign-up endpoint is closed. The only accounts
 *   are the ones the admin creates, which is the whole point of the admin
 *   panel for a class of students.
 * - no `cookieCache` - a cached session would keep working for its `maxAge`
 *   after a ban revoked it, and "blocked" must mean blocked now. Every request
 *   re-reads the session row instead; at thirty students that is nothing.
 * - `admin` plugin - gives `createUser`, `banUser` (which revokes every
 *   session), `setUserPassword`, `revokeUserSessions` and `removeUser`, all
 *   callable server-side with the caller's headers so the plugin's own
 *   admin-only check still applies.
 * - `username` plugin - sign-in is by username, the email column is a
 *   placeholder derived from it.
 * - `x-forwarded-for` - the app sits behind Dokploy's reverse proxy, and the
 *   header is what rate limiting counts clients by.
 */
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { user, session, account, verification },
  }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    minPasswordLength: 8,
  },
  trustedOrigins: process.env.BETTER_AUTH_TRUSTED_ORIGINS
    ? process.env.BETTER_AUTH_TRUSTED_ORIGINS.split(",")
        .map((origin) => origin.trim())
        .filter(Boolean)
    : undefined,
  plugins: [
    username(),
    admin({
      // Students are plain "user"; the only other role is "admin".
      defaultRole: "user",
    }),
  ],
  advanced: {
    ipAddress: {
      ipAddressHeaders: ["x-forwarded-for"],
    },
  },
})

/** The session off a server action or page render, or null. */
export async function getSession() {
  return auth.api.getSession({ headers: await headers() })
}

/**
 * The guard a protected page renders behind: redirects to sign-in rather than
 * rendering anything for a signed-out caller.
 *
 * A banned user never reaches the redirect-to-content branch - banning revokes
 * every session, so `getSession` reads no row and returns null for them.
 */
export async function requireSession() {
  const session = await getSession()

  if (!session) {
    redirect("/sign-in")
  }

  return session
}
