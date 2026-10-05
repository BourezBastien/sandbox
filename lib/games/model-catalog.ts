/**
 * The models a game can be built with, in the order a picker should offer them.
 *
 * Client-safe on purpose: ids and copy, and nothing that talks to z.ai. The
 * provider instances live in `./models`, which pulls in the provider SDK and
 * reads the API key - so a component that only needs to *name* a model never
 * drags either of those into the browser bundle.
 *
 * The empirical pecking order, from the traces: glm-4.7-flash answers in 3-4 s
 * with no thinking block; the Coding Plan's own glm-5.3 / glm-5.3-flash think
 * compulsorily (8+ s before the first token, forced per z.ai's docs). All
 * three work on a Coding Plan key.
 */
export const GAME_MODELS = [
  {
    id: "glm-4.7-flash",
    name: "GLM 4.7 Flash",
    tagline:
      "Le plus rapide : répond en quelques secondes, sans réfléchir. Gratuit.",
  },
  {
    id: "glm-5.3-flash",
    name: "GLM 5.3 Flash",
    tagline:
      "Inclus dans l'abonnement Coding Plan. Réfléchit avant de répondre.",
  },
  {
    id: "glm-5.3",
    name: "GLM 5.3",
    tagline:
      "Le plus doué, inclus dans l'abonnement. Pour les grosses constructions.",
  },
] as const

/**
 * The id of a model this app offers.
 *
 * Derived from the catalog rather than written out again, so the union and the
 * list a player sees cannot drift: adding an entry above is the whole of adding
 * a model, and every exhaustive switch on this type reports what is missing.
 */
export type GameModelId = (typeof GAME_MODELS)[number]["id"]

/**
 * What a turn runs on when nothing picked otherwise.
 *
 * glm-4.7-flash: the only model observed answering in 3-4 s without a
 * thinking block, and it works on a Coding Plan key. The subscription's own
 * models (glm-5.3, glm-5.3-flash) think compulsorily - 8+ s before the first
 * token even with reasoning_effort low - so they are the picker's options
 * for big builds, not the classroom default. One 35 s queue incident was
 * observed on the free flash across every session so far; it self-recovered
 * through the retry.
 */
export const DEFAULT_GAME_MODEL_ID: GameModelId = "glm-4.7-flash"

/**
 * Whether a value names a model this app offers.
 *
 * A guard rather than a bare comparison, because the places that need it take
 * the id from somewhere the app doesn't control - a URL, a server action's
 * arguments - and want the narrowed type on the other side of the check.
 */
export function isGameModelId(value: unknown): value is GameModelId {
  return GAME_MODELS.some((model) => model.id === value)
}
