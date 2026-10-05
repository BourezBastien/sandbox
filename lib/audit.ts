import { eq } from "drizzle-orm"

// Imported straight from `./client` rather than `@/lib/db`, like the chat
// store: this module is also called from inside the Trigger.dev worker, where
// the `server-only` marker on the `@/lib/db` entry would throw.
import { db, auditLog, games, user } from "@/lib/db/client"

/**
 * The activity journal, shared by the Next server and the Trigger.dev worker.
 *
 * A school keeps its records: games survive deletion as rows, and every
 * significant action leaves a line here. The one thing this module must never
 * do is break the action it is recording - a failed insert is logged to the
 * console and swallowed, because "the game was created but the journal missed
 * it" beats "the game was not created".
 *
 * Message *contents* are never written here. They live on the game row, which
 * outlives deletion; the journal records that a turn happened, not what was
 * said.
 */

/** How an actor is named on a journal line, outliving the account itself. */
export function actorLabelFor(user: {
  name: string
  username?: string | null
}) {
  return user.username ? `${user.name} (${user.username})` : user.name
}

export async function recordAudit(entry: {
  actorId?: string | null
  /** When omitted, resolved from `actorId`; falls back to a system label. */
  actorLabel?: string
  action: AuditAction
  targetType?: "game" | "user"
  targetId?: string
  detail?: string
}) {
  try {
    let actorLabel = entry.actorLabel

    if (!actorLabel) {
      if (entry.actorId) {
        const [actor] = await db
          .select({ name: user.name, username: user.username })
          .from(user)
          .where(eq(user.id, entry.actorId))
          .limit(1)

        actorLabel = actor ? actorLabelFor(actor) : "Compte supprimé"
      } else {
        actorLabel = "Système"
      }
    }

    await db.insert(auditLog).values({
      actorId: entry.actorId ?? null,
      actorLabel,
      action: entry.action,
      targetType: entry.targetType ?? null,
      targetId: entry.targetId ?? null,
      detail: entry.detail ?? null,
    })
  } catch (error) {
    // Deliberately swallowed, per the note above. The console is the only
    // trace of a journal that stopped journaling.
    console.error("[audit] Could not record an entry:", error)
  }
}

/**
 * One journal line per finished turn, naming the student whose game it was.
 *
 * Called from the worker's `onTurnComplete`, where there is no session to read
 * the actor from: the owner is settled from the row, which a tab cannot
 * reach. A game whose owner has been removed still journals - the label says
 * so, because the trace has to outlive the account.
 */
export async function recordGameTurn(gameId: string, messageCount: number) {
  try {
    const [game] = await db
      .select({ userId: games.userId, ownerSnapshot: games.ownerSnapshot })
      .from(games)
      .where(eq(games.id, gameId))
      .limit(1)

    if (!game) {
      return
    }

    const [owner] = await db
      .select({ name: user.name, username: user.username })
      .from(user)
      .where(eq(user.id, game.userId))
      .limit(1)

    await recordAudit({
      actorId: game.userId,
      actorLabel: owner
        ? actorLabelFor(owner)
        : (game.ownerSnapshot ?? "Compte supprimé"),
      action: "game.turn",
      targetType: "game",
      targetId: gameId,
      detail: `${messageCount} messages dans le fil`,
    })
  } catch (error) {
    console.error("[audit] Could not record a game turn:", error)
  }
}

export type AuditAction =
  | "game.created"
  | "game.renamed"
  | "game.deleted"
  | "game.turn"
  | "user.created"
  | "user.password_reset"
  | "user.force_signed_out"
  | "user.banned"
  | "user.unbanned"
  | "user.deleted"

/** What each action reads as on the journal page. */
export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  "game.created": "Jeu créé",
  "game.renamed": "Jeu renommé",
  "game.deleted": "Jeu supprimé",
  "game.turn": "Tour de jeu",
  "user.created": "Compte créé",
  "user.password_reset": "Mot de passe réinitialisé",
  "user.force_signed_out": "Déconnexion forcée",
  "user.banned": "Compte bloqué",
  "user.unbanned": "Compte débloqué",
  "user.deleted": "Compte supprimé",
}
