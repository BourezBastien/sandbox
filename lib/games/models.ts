import { createAnthropic } from "@ai-sdk/anthropic"
import type { LanguageModel } from "ai"

import type { GameModelId } from "./model-catalog"

/**
 * The provider instance behind each catalog entry.
 *
 * The models are GLM, served through z.ai's Anthropic-compatible endpoint -
 * the same Messages API shape `@ai-sdk/anthropic` speaks, with a different
 * base URL and key. `Z_AI_BASE_URL` exists so a key that lives somewhere else
 * (a proxy, a mirror) can be pointed at without a code change.
 *
 * Server-side only - constructing these reaches for `Z_AI_API_KEY`, and the
 * provider SDK has no business in a browser bundle. There is no
 * `server-only` marker enforcing that, though, for the same reason `@/lib/db`
 * keeps its marker in a separate entry: the chat agent imports this module and
 * runs in the Trigger.dev worker, where that marker throws. Reach for the
 * catalog instead of this file from anything a client component can touch.
 *
 * `satisfies` rather than an annotation, so the record has to cover every
 * `GameModelId` - a model added to the catalog and forgotten here is a type
 * error, not an undefined model discovered at the top of someone's turn.
 */
const zai = createAnthropic({
  baseURL: process.env.Z_AI_BASE_URL ?? "https://api.z.ai/api/anthropic",
  apiKey: process.env.Z_AI_API_KEY,
})

export const gameModels = {
  "glm-4.7": zai("glm-4.7"),
  "glm-4.5-air": zai("glm-4.5-air"),
  "glm-4.7-flash": zai("glm-4.7-flash"),
} satisfies Record<GameModelId, LanguageModel>
