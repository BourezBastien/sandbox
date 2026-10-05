/**
 * The models a game can be built with, in the order a picker should offer them.
 *
 * Client-safe on purpose: ids and copy, and nothing that talks to z.ai. The
 * provider instances live in `./models`, which pulls in the provider SDK and
 * reads the API key - so a component that only needs to *name* a model never
 * drags either of those into the browser bundle.
 *
 * The ids are z.ai's own. Per the Coding Plan docs, the subscription covers
 * exactly glm-5.3 and glm-5.3-flash, and older ids (glm-4.7, glm-4.5-*) are
 * rerouted to one of those two anyway - so the catalog names the real models.
 */
export const GAME_MODELS = [
  {
    id: "glm-5.3-flash",
    name: "GLM 5.3 Flash",
    tagline:
      "Rapide, inclus dans l'abonnement Coding Plan. Le choix de la classe.",
  },
  {
    id: "glm-5.3",
    name: "GLM 5.3",
    tagline:
      "Le plus doué, inclus dans l'abonnement. Réfléchit avant chaque réponse.",
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
 * glm-5.3-flash: the cheap half of what the Coding Plan subscription covers
 * (per z.ai's devpack docs), so classroom usage draws on the paid plan rather
 * than a pay-as-you-go balance that may not exist. The flagship glm-5.3 is
 * one picker click away for big builds.
 */
export const DEFAULT_GAME_MODEL_ID: GameModelId = "glm-5.3-flash"

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
