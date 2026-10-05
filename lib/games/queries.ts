import "server-only"

import { and, desc, eq } from "drizzle-orm"

import { db, games, type Game } from "@/lib/db"
import { getSession } from "@/lib/auth"

/**
 * The caller off the current request, with just what scoping needs.
 *
 * Null for a signed-out caller - the same "nothing is visible" state the org
 * version of these queries had.
 */
async function currentUser() {
  const session = await getSession()

  return session?.user ?? null
}

/**
 * Games belonging to the caller, newest first.
 *
 * An admin sees their own games here, same as a student - the sidebar is a
 * personal recents list. Everything a game belongs to is on `/admin/games`.
 */
export async function listGames(): Promise<Game[]> {
  const user = await currentUser()

  // Every game is owned by a user, so without a session there is nothing this
  // caller is allowed to see.
  if (!user) {
    return []
  }

  return db
    .select()
    .from(games)
    .where(eq(games.userId, user.id))
    .orderBy(desc(games.createdAt))
}

// Postgres rejects a malformed uuid with an error rather than an empty result,
// so bad ids from the URL are filtered out before they reach the query.
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * A single game, or `undefined` when it doesn't exist or belongs to someone
 * else.
 *
 * The one exception is the admin: every game is theirs to open - watching a
 * student's build in progress is the point of the admin pages, and the preview
 * route and chat tokens authorize through this same lookup.
 */
export async function getGame(id: string): Promise<Game | undefined> {
  const user = await currentUser()

  if (!user || !UUID_RE.test(id)) {
    return undefined
  }

  const [game] = await db
    .select()
    .from(games)
    .where(
      and(
        eq(games.id, id),
        // `and` drops the undefined entry, so a student's lookup stays scoped
        // to their own rows while the admin's has no owner filter at all.
        user.role === "admin" ? undefined : eq(games.userId, user.id)
      )
    )
    .limit(1)

  return game
}
