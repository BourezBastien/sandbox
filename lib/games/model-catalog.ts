/**
 * The models a game can be built with, in the order a picker should offer them.
 *
 * Client-safe on purpose: ids and copy, and nothing that talks to a provider.
 * The provider instances live in `./models`, which pulls in the provider SDK
 * and reads the API keys - so a component that only needs to *name* a model
 * never drags either of those into the browser bundle.
 *
 * Why DeepSeek leads: their Flash model is the only one of the lot whose
 * thinking can be switched OFF (documented, and injected per request) -
 * no reflection warm-up, no queue observed, 2500 concurrent connections
 * per account, and pay-as-you-go at cents. z.ai's GLMs stay as options:
 * the Coding Plan models think compulsorily (5-9 s steady), the free flash
 * is fast off-peak but congests at peak hours.
 */
export const GAME_MODELS = [
  {
    id: "deepseek-flash",
    name: "DeepSeek Flash",
    tagline:
      "Rapide et régulier : répond sans réfléchir, à toute heure. Le choix de la classe.",
  },
  {
    id: "deepseek-v4-pro",
    name: "DeepSeek V4 Pro",
    tagline:
      "Le plus doué pour le code. Plus lent : il réfléchit avant chaque réponse.",
  },
  {
    id: "glm-5.3-flash",
    name: "GLM 5.3 Flash",
    tagline:
      "Inclus dans l'abonnement z.ai Coding Plan. Réflexion obligatoire : 5 à 9 s par réponse.",
  },
  {
    id: "glm-4.7-flash",
    name: "GLM 4.7 Flash",
    tagline:
      "Gratuit et très rapide aux heures creuses, mais saturé aux heures de pointe.",
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
 * deepseek-flash with thinking disabled: no reflection warm-up, no observed
 * queueing, and a per-account concurrency limit of 2500 - the only model in
 * the catalog both fast AND steady. Requires DEEPSEEK_API_KEY in the
 * environment; the GLM options keep the app usable without one.
 */
export const DEFAULT_GAME_MODEL_ID: GameModelId = "deepseek-flash"

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
