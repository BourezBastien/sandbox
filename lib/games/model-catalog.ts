/**
 * The models a game can be built with, in the order a picker should offer them.
 *
 * Client-safe on purpose: ids and copy, and nothing that talks to z.ai. The
 * provider instances live in `./models`, which pulls in the provider SDK and
 * reads the API key - so a component that only needs to *name* a model never
 * drags either of those into the browser bundle.
 *
 * The ids are z.ai's own model ids rather than slugs of our own. There is one
 * provider behind all three and no versioning story to hide, so a second name
 * for each would only be a mapping to keep in step.
 */
export const GAME_MODELS = [
  {
    id: "glm-4.7-flash",
    name: "GLM 4.7 Flash",
    tagline:
      "Le plus rapide, et gratuit. Répond et construit sans attendre.",
  },
  {
    id: "glm-4.7",
    name: "GLM 4.7",
    tagline:
      "Le plus doué, mais il réfléchit longtemps avant chaque réponse.",
  },
  {
    id: "glm-4.5-air",
    name: "GLM 4.5 Air",
    tagline: "Rapide et léger. Parfait pour améliorer un jeu qui tourne.",
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
 * Flash, not the flagship: z.ai turns thinking ON for the reasoning models
 * and offers no way to turn it off, which adds 5 to 9 seconds before the
 * first token of *every* step of a build. In a 30-minute class session,
 * snappy beats brilliant - the heavier models stay one picker click away.
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
