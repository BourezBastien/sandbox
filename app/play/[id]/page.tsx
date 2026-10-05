import { eq } from "drizzle-orm"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { GameFrame } from "@/components/game-frame"
import { db, games } from "@/lib/db"

/**
 * The public face of a shared game: no session, no sidebar, no chat - just
 * the game, full screen, under a link its owner can hand to anyone.
 *
 * The iframe loads through the share proxy, which re-signs the sandbox url on
 * every request, so the link outlives the hour-long signed urls the private
 * preview uses. A sandbox asleep for weeks is woken on the first hit; a game
 * whose sandbox is gone (deleted with its owner, for instance) answers the
 * iframe with a friendly message rather than a broken frame.
 */
async function loadPublicGame(id: string) {
  const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!UUID_RE.test(id)) {
    return undefined
  }

  const [game] = await db
    .select({
      id: games.id,
      title: games.title,
      sandboxId: games.sandboxId,
      deletedAt: games.deletedAt,
    })
    .from(games)
    .where(eq(games.id, id))
    .limit(1)

  return game
}

export async function generateMetadata({
  params,
}: PageProps<"/play/[id]">): Promise<Metadata> {
  const { id } = await params
  const game = await loadPublicGame(id)

  return { title: game ? game.title : "Jeu introuvable" }
}

export default async function PlayPage({
  params,
}: PageProps<"/play/[id]">) {
  const { id } = await params
  const game = await loadPublicGame(id)

  if (!game) {
    notFound()
  }

  return (
    <div className="flex h-svh flex-col">
      <header className="flex h-12 shrink-0 items-center justify-between gap-2 border-b px-4">
        <span className="truncate font-heading text-sm font-medium">
          {game.title}
        </span>
        <Link
          href="/"
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          Créer ton propre jeu
        </Link>
      </header>
      {game.sandboxId ? (
        <GameFrame
          src={`/api/games/${game.id}/share/index.html`}
          title={game.title}
          className="w-full flex-1"
        />
      ) : (
        <p className="flex flex-1 items-center justify-center p-8 text-center text-sm text-muted-foreground">
          Ce jeu n&apos;a pas encore été construit : reviens quand son
          créateur aura joué son premier tour.
        </p>
      )}
    </div>
  )
}
