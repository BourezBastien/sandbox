import "server-only"

import * as Sentry from "@sentry/nextjs"

import type { Game } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { getGame } from "@/lib/games/queries"

/**
 * The check every action that names a game runs first.
 *
 * Server Actions are reachable by direct POST, so the game id arrives from the
 * browser and the caller is resolved from the session rather than trusted
 * from the request. Shared between the chat actions - which hand out tokens
 * for a game's thread - and the actions that rename or delete a game, because
 * "signed in" is not the same as "entitled to this game" for any of them.
 *
 * The admin passes this check for any game, not just their own: opening a
 * student's game is a read, and the writes it gates (rename, delete, chat
 * tokens) are exactly what supervising a class needs.
 *
 * Returns the row as well as the identity, so callers that need what is on it
 * (the sandbox a delete has to take with it) don't read it twice.
 */
export async function authorizeGame(
  gameId: string,
  action: string
): Promise<{ game: Game; userId: string }> {
  const session = await getSession()
  const user = session?.user ?? null

  // These two rejections are the app's authorization boundary, and a boundary
  // nobody can see is a boundary nobody can tell is holding. Both are warnings
  // rather than errors: a signed-out tab left open produces the first and a
  // stale bookmark the second, so neither is on its own a problem - a run of
  // them from one caller is.
  if (!user) {
    Sentry.logger.warn(
      Sentry.logger.fmt`Rejected unauthenticated ${action} for game ${gameId}`,
      {
        "app.action": action,
        "game.id": gameId,
        "auth.has_user": false,
      }
    )

    throw new Error("Unauthorized")
  }

  // Also the ownership check - `getGame` only resolves games the caller owns,
  // or any game at all for the admin.
  const game = await getGame(gameId)

  if (!game) {
    Sentry.logger.warn(
      Sentry.logger
        .fmt`Rejected ${action} for game ${gameId} the caller cannot see`,
      {
        "app.action": action,
        "game.id": gameId,
        "user.id": user.id,
      }
    )

    throw new Error("Not Found")
  }

  // Tags rather than scope attributes, and for events rather than logs:
  // attributes set on a scope never reach logs, and the logs in the callers
  // name the game explicitly anyway. What this buys is that a throw further
  // down - the Trigger handover, a sandbox that won't delete - arrives already
  // saying which game and caller it was.
  //
  // Per-request rather than global, so one caller's identity cannot leak into
  // a concurrent request's events.
  Sentry.getIsolationScope().setTags({
    "app.action": action,
    "game.id": gameId,
    "user.id": user.id,
  })

  return { game, userId: user.id }
}
