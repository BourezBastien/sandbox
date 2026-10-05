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

/**
 * GLM-5.3 and GLM-5.3-Flash cannot have thinking disabled, but their thinking
 * depth follows `reasoning_effort` - which z.ai defaults to `max`. For a game
 * built through 48 tool-call steps, `max` buys depth nobody reads and costs
 * 5-9 s before every first token. `low` keeps a short pass of reasoning and
 * gives it back as speed. Only injected for the 5.3 family, per the API
 * reference; other models keep their own behavior.
 */
function withReasoningEffortLow(fetchFn: typeof fetch): typeof fetch {
  return async (input, init) => {
    if (typeof init?.body === "string") {
      try {
        const body = JSON.parse(init.body) as Record<string, unknown>

        if (
          body &&
          typeof body === "object" &&
          typeof body.model === "string" &&
          body.model.startsWith("glm-5.3") &&
          !("reasoning_effort" in body)
        ) {
          init = {
            ...init,
            body: JSON.stringify({ ...body, reasoning_effort: "low" }),
          }
        }
      } catch {
        // Not JSON, or not ours to touch: send it exactly as received.
      }
    }

    return fetchFn(input, init)
  }
}

/**
 * DeepSeek's thinking is off-switchable (unlike z.ai's GLM-5.3 family), and
 * their docs document exactly this body shape. A game built through 48
 * tool-call steps does not need a meditation before each one: injected on
 * every DeepSeek request that doesn't already carry a thinking preference.
 */
function withThinkingDisabled(fetchFn: typeof fetch): typeof fetch {
  return async (input, init) => {
    if (typeof init?.body === "string") {
      try {
        const body = JSON.parse(init.body) as Record<string, unknown>

        if (
          body &&
          typeof body === "object" &&
          !("thinking" in body)
        ) {
          init = {
            ...init,
            body: JSON.stringify({ ...body, thinking: { type: "disabled" } }),
          }
        }
      } catch {
        // Not JSON, or not ours to touch: send it exactly as received.
      }
    }

    return fetchFn(input, init)
  }
}

const zai = createAnthropic({
  // The /v1 is not optional: the SDK appends "/messages" to the baseURL
  // (Anthropic's own baseURL already carries /v1), so without it every call
  // lands on a path z.ai answers with {"code":500,"msg":"404 NOT_FOUND"} -
  // wrapped in HTTP 200, which the SDK then reads as an SSE stream that
  // produces nothing and closes without a finish chunk.
  baseURL:
    process.env.Z_AI_BASE_URL ?? "https://api.z.ai/api/anthropic/v1",
  apiKey: process.env.Z_AI_API_KEY,
  // z.ai's Anthropic-compatible endpoint accepts either auth convention -
  // `x-api-key` (what the SDK sends by default) or `Authorization: Bearer`
  // (what their own docs tell Claude Code users to use, and what
  // subscription keys are issued for). Sending both costs nothing.
  headers: process.env.Z_AI_API_KEY
    ? { Authorization: `Bearer ${process.env.Z_AI_API_KEY}` }
    : undefined,
  fetch: withReasoningEffortLow(
    process.env.Z_AI_DEBUG === "true" ? debugFetch : fetch
  ),
})

// Same pattern as zai: the SDK appends "/messages", DeepSeek's Anthropic
// base is /anthropic, so the /v1 rides in the baseURL. DeepSeek authenticates
// with `Authorization: Bearer` - sent alongside the SDK's `x-api-key`.
const deepseek = createAnthropic({
  baseURL:
    process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com/anthropic/v1",
  apiKey: process.env.DEEPSEEK_API_KEY,
  headers: process.env.DEEPSEEK_API_KEY
    ? { Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}` }
    : undefined,
  fetch: withThinkingDisabled(fetch),
})

export const gameModels = {
  "deepseek-flash": deepseek("deepseek-flash"),
  "deepseek-v4-pro": deepseek("deepseek-v4-pro"),
  "glm-5.3-flash": zai("glm-5.3-flash"),
  "glm-4.7-flash": zai("glm-4.7-flash"),
} satisfies Record<GameModelId, LanguageModel>
