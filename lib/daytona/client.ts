import { Daytona } from "@daytona/sdk"

/**
 * The Daytona client, created on first use rather than at import.
 *
 * Import time is the wrong moment to demand the key: Trigger.dev's deployment
 * indexing imports the task files in a build container where the runtime
 * environment variables do not exist yet, and a throw there fails the whole
 * deployment ("There was an error importing task files"). At runtime - a tool
 * call, a preview load - the variable is set and the first call pays a
 * one-time construction instead.
 */
let client: Daytona | null = null

export function getDaytona(): Daytona {
  if (!client) {
    if (!process.env.DAYTONA_API_KEY) {
      throw new Error("DAYTONA_API_KEY is not set")
    }

    client = new Daytona()
  }

  return client
}
