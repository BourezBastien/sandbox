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
/**
 * Z_AI_DEBUG=true pipes the raw z.ai request and response into the run log
 * (console, visible on cloud.trigger.dev). The SSE stream is teed, so the
 * model call itself is untouched - only its wire traffic becomes readable.
 *
 * Made for exactly this class of failure: a stream that closes without a
 * finish chunk says nothing about why, and the raw events are the only place
 * the reason is written down. Leave it off otherwise: it logs prompt text.
 */
async function debugFetch(
  input: Parameters<typeof fetch>[0],
  init?: Parameters<typeof fetch>[1]
): Promise<Response> {
  if (typeof init?.body === "string") {
    console.log("[zai] >>>", init.body.slice(0, 4000))
  }

  const response = await fetch(input, init)

  console.log("[zai] <<<", response.status)

  if (!response.body) {
    return response
  }

  const [forSdk, forLog] = response.body.tee()
  let logged = 0
  void forLog.pipeTo(
    new WritableStream<Uint8Array>({
      write(chunk) {
        if (logged >= 8000) {
          return
        }
        const text = new TextDecoder().decode(chunk).slice(0, 8000 - logged)
        logged += text.length
        console.log("[zai]", text)
      },
    })
  )

  return new Response(forSdk, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  })
}

const zai = createAnthropic({
  baseURL: process.env.Z_AI_BASE_URL ?? "https://api.z.ai/api/anthropic",
  apiKey: process.env.Z_AI_API_KEY,
  // z.ai's Anthropic-compatible endpoint has been seen accepting either auth
  // convention - `x-api-key` (what the SDK sends by default) or
  // `Authorization: Bearer` (what their own docs tell Claude Code users to
  // use, and what subscription keys are issued for). Sending both costs
  // nothing and rules out a stream that closes empty because the key on the
  // wire was read by nobody.
  headers: process.env.Z_AI_API_KEY
    ? { Authorization: `Bearer ${process.env.Z_AI_API_KEY}` }
    : undefined,
  fetch: process.env.Z_AI_DEBUG === "true" ? debugFetch : undefined,
})

export const gameModels = {
  "glm-4.7": zai("glm-4.7"),
  "glm-4.5-air": zai("glm-4.5-air"),
  "glm-4.7-flash": zai("glm-4.7-flash"),
} satisfies Record<GameModelId, LanguageModel>
