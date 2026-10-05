"use server"

import * as Sentry from "@sentry/nextjs"
import { eq, inArray } from "drizzle-orm"
import { headers } from "next/headers"
import { refresh } from "next/cache"

import { auth, getSession } from "@/lib/auth"
import { db, games, user } from "@/lib/db"
import { deleteGameSandboxes } from "@/lib/daytona/utils"
import { cancelGameChatRun, endGameChatSession } from "@/lib/games/chat-session"
import { describeError, elapsed } from "@/lib/observability"

// Mirrors what Better Auth itself enforces, so an account is rejected with the
// admin panel's own words rather than the library's.
const MIN_USERNAME_LENGTH = 3
const MIN_PASSWORD_LENGTH = 8

/** The placeholder domain for emails — no student has a real one to give. */
const PLACEHOLDER_EMAIL_DOMAIN = "college.local"

/**
 * The guard every admin action runs first: signed in, and the admin role.
 *
 * Server Actions are reachable by direct POST, so this is checked here rather
 * than trusted from the page that rendered the button — the page hiding the
 * button is UX, not security.
 */
async function requireAdmin() {
  const session = await getSession()

  if (!session || session.user.role !== "admin") {
    throw new Error("Unauthorized")
  }

  return session
}

/**
 * Normalizes and validates what an account is created from.
 *
 * Usernames are lowercased on purpose: they are typed by students, on school
 * keyboards, and `Martin` and `martin` being two different accounts helps
 * nobody. The email is a placeholder derived from the username — the email
 * column is required by Better Auth but means nothing here, and deriving it
 * keeps it unique for free.
 */
function prepareAccountInput(username: string, password: string, name: string) {
  const normalizedUsername = username.trim().toLowerCase()

  if (normalizedUsername.length < MIN_USERNAME_LENGTH) {
    throw new Error(
      `A username needs at least ${MIN_USERNAME_LENGTH} characters.`
    )
  }

  if (!/^[a-z0-9._-]+$/.test(normalizedUsername)) {
    throw new Error(
      "A username can only use letters, numbers, dots, underscores and dashes."
    )
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(
      `A password needs at least ${MIN_PASSWORD_LENGTH} characters.`
    )
  }

  return {
    username: normalizedUsername,
    password,
    name: name.trim() || normalizedUsername,
    email: `${normalizedUsername}@${PLACEHOLDER_EMAIL_DOMAIN}`,
  }
}

/**
 * Creates a user row and its credential account, the way Better Auth's own
 * sign-up would.
 *
 * Used by both the /install bootstrap (where no admin exists yet to call the
 * admin endpoints) and the admin panel — the panel's actions add `role` and
 * their own guard on top. The password is hashed by the same scrypt
 * configuration sign-in verifies against, so nothing here is a backdoor.
 */
async function insertAccount({
  username,
  name,
  email,
  password,
  role,
}: {
  username: string
  name: string
  email: string
  password: string
  role: "admin" | "user"
}) {
  const context = await auth.$context

  const createdUser = await context.internalAdapter.createUser(
    {
      email,
      name,
      username,
      emailVerified: true,
      role,
    },
    // The method Better Auth's own sign-up passes — it is how plugins tell
    // which rules apply to the user being made.
    { method: "email-password" }
  )

  if (!createdUser) {
    throw new Error("The account could not be created. Try again.")
  }

  const passwordHash = await context.password.hash(password)

  await context.internalAdapter.linkAccount({
    userId: createdUser.id,
    providerId: "credential",
    accountId: createdUser.id,
    password: passwordHash,
  })

  return createdUser
}

/**
 * The /install bootstrap: creates the first admin account, exactly once.
 *
 * Reachable without a session by design — there is nothing to sign in to yet.
 * The gate is that no admin exists: once one does, this throws and /install
 * redirects away from its form. Two installs racing each other are settled by
 * the unique constraints on username and email, so the worst case is one
 * clear error rather than two admins.
 */
export async function installAdmin(input: {
  username: string
  name: string
  password: string
}) {
  const startedAt = performance.now()

  const [existingAdmin] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.role, "admin"))
    .limit(1)

  if (existingAdmin) {
    throw new Error("Installation is already complete.")
  }

  const prepared = prepareAccountInput(
    input.username,
    input.password,
    input.name
  )

  const admin = await insertAccount({ ...prepared, role: "admin" })

  Sentry.logger.info("Installed the admin account", {
    "app.action": "installAdmin",
    "user.id": admin.id,
    duration_ms: elapsed(startedAt),
  })
}

/**
 * Creates a student account.
 */
export async function createStudentAccount(input: {
  username: string
  name: string
  password: string
}) {
  await requireAdmin()

  const prepared = prepareAccountInput(
    input.username,
    input.password,
    input.name
  )

  try {
    await insertAccount({ ...prepared, role: "user" })
  } catch (error) {
    // The only input the constraints can reject is a username that already
    // exists — everything else about the shape was validated above.
    Sentry.logger.warn(
      Sentry.logger
        .fmt`Rejected an account for existing username ${prepared.username}`,
      { "app.action": "createStudentAccount", ...describeError(error) }
    )

    throw new Error("That username is already taken.")
  }

  refresh()
}

/**
 * Sets a new password for an account, and signs it out everywhere.
 *
 * Signing out is part of the reset rather than a courtesy: a password changed
 * because it was shared or leaked is a password every logged-in tab should
 * stop trusting.
 */
export async function resetUserPassword(input: {
  userId: string
  password: string
}) {
  await requireAdmin()

  if (input.password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(
      `A password needs at least ${MIN_PASSWORD_LENGTH} characters.`
    )
  }

  await auth.api.setUserPassword({
    body: { userId: input.userId, newPassword: input.password },
    headers: await headers(),
  })

  await auth.api.revokeUserSessions({
    body: { userId: input.userId },
    headers: await headers(),
  })
}

/**
 * Blocks an account, for real: every session dies, every in-flight build is
 * stopped, and the next request from them is refused.
 *
 * The three steps in order:
 *  1. `banUser` marks the row — the admin plugin's session read rejects a
 *     banned user even before their session rows are gone, so there is no
 *     gap between the two.
 *  2. `revokeUserSessions` deletes the session rows, which is what keeps them
 *     out after the ban reason is read.
 *  3. Cancel the current run of each of their games. A stream already on the
 *     wire finishes its chunk and no more; the session stays open, because
 *     closing it is terminal for the thread and an unblock next week should
 *     find the game still usable.
 */
export async function banUserAccount(input: {
  userId: string
  banReason?: string
}) {
  await requireAdmin()

  await auth.api.banUser({
    body: { userId: input.userId, banReason: input.banReason },
    headers: await headers(),
  })

  await auth.api.revokeUserSessions({
    body: { userId: input.userId },
    headers: await headers(),
  })

  const owned = await db
    .select({ id: games.id })
    .from(games)
    .where(eq(games.userId, input.userId))

  await Promise.all(owned.map(({ id }) => cancelGameChatRun(id)))

  Sentry.logger.info(Sentry.logger.fmt`Blocked user ${input.userId}`, {
    "app.action": "banUserAccount",
    "user.id": input.userId,
    "game.count": owned.length,
  })

  refresh()
}

/**
 * Unblocks an account. Sessions were revoked at ban time, so the student
 * signs back in — nothing to restore beyond the flag itself.
 */
export async function unbanUserAccount(input: { userId: string }) {
  await requireAdmin()

  await auth.api.unbanUser({
    body: { userId: input.userId },
    headers: await headers(),
  })

  refresh()
}

/**
 * Signs an account out of every tab it has open, without blocking it.
 *
 * The mid-class "put that away" button: cheaper than a ban, and everything
 * works again the moment they sign back in.
 */
export async function forceSignOut(input: { userId: string }) {
  await requireAdmin()

  const owned = await db
    .select({ id: games.id })
    .from(games)
    .where(eq(games.userId, input.userId))

  await Promise.all(owned.map(({ id }) => cancelGameChatRun(id)))

  await auth.api.revokeUserSessions({
    body: { userId: input.userId },
    headers: await headers(),
  })

  refresh()
}

/**
 * Deletes an account, its games, and everything Daytona is holding for them.
 *
 * The per-game cleanup is the delete-game path in miniature — end the chat
 * session (a turn left streaming would keep calling tools against a game that
 * no longer exists), then the sandboxes, then the row. Failures on individual
 * games are logged and swallowed: the account is going either way, and an
 * orphaned sandbox is cleaner than an admin who cannot remove a student.
 */
export async function removeUserAccount(input: { userId: string }) {
  await requireAdmin()

  const session = await getSession()
  const callerId = session?.user.id

  if (callerId === input.userId) {
    throw new Error("You cannot delete your own admin account.")
  }

  const owned = await db
    .select({ id: games.id, sandboxId: games.sandboxId })
    .from(games)
    .where(eq(games.userId, input.userId))

  for (const game of owned) {
    try {
      await endGameChatSession(game.id)
      await deleteGameSandboxes(game.id, game.sandboxId)
    } catch (error) {
      Sentry.logger.error(
        Sentry.logger
          .fmt`Could not clean up game ${game.id} of deleted user ${input.userId}`,
        {
          "app.action": "removeUserAccount",
          "game.id": game.id,
          "user.id": input.userId,
          ...describeError(error),
        }
      )
    }
  }

  if (owned.length > 0) {
    await db.delete(games).where(
      inArray(
        games.id,
        owned.map(({ id }) => id)
      )
    )
  }

  await auth.api.removeUser({
    body: { userId: input.userId },
    headers: await headers(),
  })

  Sentry.logger.info(Sentry.logger.fmt`Deleted user ${input.userId}`, {
    "app.action": "removeUserAccount",
    "user.id": input.userId,
    "game.count": owned.length,
  })

  refresh()
}
