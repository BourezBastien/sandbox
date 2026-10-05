/**
 * The journal's action vocabulary, kept apart from `@/lib/audit` on purpose:
 * this file has no imports at all, so a client component can name an action
 * without dragging the database client into the browser bundle.
 */

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
