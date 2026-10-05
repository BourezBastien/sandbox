import * as Sentry from "@sentry/nextjs"
import { eq } from "drizzle-orm"

import { db, games } from "@/lib/db"
import {
  PREVIEW_PORT,
  PREVIEW_URL_TTL_SECONDS,
  startGameServer,
} from "@/lib/daytona/utils"
import { describeError, elapsed } from "@/lib/observability"

/**
 * The public, permanent door to a game: everything under this route is served
 * to anyone, session or not, so a shared link (`/play/<id>`) keeps working.
 *
 * The private preview route signs a Daytona url that expires after an hour -
 * fine next to a chat the player is signed into, useless as a link to send
 * around. This proxy instead re-signs on every request and streams the
 * sandbox's static server through, which also means a sandbox that went idle
 * is woken transparently on the first hit.
 *
 * Security rests on two things: the game id is an unguessable uuid, and the
 * sandbox only ever serves the game directory - there is nothing else behind
 * this door.
 */
export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/games/[id]/share/[...path]">
) {
  const startedAt = performance.now()
  const { id, path } = await ctx.params

  const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!UUID_RE.test(id)) {
    return Response.json({ error: "Jeu introuvable" }, { status: 404 })
  }

  const [game] = await db
    .select({ sandboxId: games.sandboxId, deletedAt: games.deletedAt })
    .from(games)
    .where(eq(games.id, id))
    .limit(1)

  if (!game) {
    return Response.json({ error: "Jeu introuvable" }, { status: 404 })
  }

  if (game.deletedAt) {
    return Response.json({ error: "Ce jeu a été supprimé" }, { status: 410 })
  }

  if (!game.sandboxId) {
    return Response.json(
      { error: "Ce jeu n'a pas encore été construit" },
      { status: 409 }
    )
  }

  try {
    // Wakes an idle sandbox and makes sure the static server is on the port.
    const { sandbox } = await startGameServer(game.sandboxId)
    const { url } = await sandbox.getSignedPreviewUrl(
      PREVIEW_PORT,
      PREVIEW_URL_TTL_SECONDS
    )

    const target = `${url.replace(/\/+$/, "")}/${(path ?? []).join("/")}`
    const upstream = await fetch(target, { redirect: "manual" })

    if (upstream.status >= 400) {
      // Almost always a stale asset after a rebuild: no caching on misses.
      return Response.json(
        { error: "Fichier introuvable dans le jeu" },
        { status: upstream.status }
      )
    }

    Sentry.logger.info(Sentry.logger.fmt`Served shared file for game ${id}`, {
      "game.id": id,
      "share.path": (path ?? []).join("/"),
      "http.response.status_code": upstream.status,
      duration_ms: elapsed(startedAt),
    })

    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        // The engine files don't change within a build; a minute of sharing
        // keeps a burst of iframe loads off the sandbox without serving
        // stale files across a turn for long.
        "cache-control": "public, max-age=60",
        ...(upstream.headers.get("content-type")
          ? { "content-type": upstream.headers.get("content-type")! }
          : {}),
      },
    })
  } catch (error) {
    // Typically a sandbox that was deleted with its owner's account: the row
    // survives for the records, the game behind it does not.
    Sentry.logger.error(
      Sentry.logger.fmt`Could not serve shared game ${id}`,
      { "game.id": id, ...describeError(error) }
    )

    return Response.json(
      { error: "Ce jeu n'est plus disponible" },
      { status: 410 }
    )
  }
}
