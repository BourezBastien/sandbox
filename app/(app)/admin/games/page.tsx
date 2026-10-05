import type { Metadata } from "next"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { listAllGamesWithOwners } from "@/lib/admin/queries"

export const metadata: Metadata = {
  title: "Games",
}

const TIME_FORMAT = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
})

/**
 * Every game in the class, sorted by latest activity.
 *
 * A row's link opens the game's own page as the admin — the live preview and
 * the chat thread play there exactly as the student sees them, including a
 * turn in progress. `updated_at` moves on every turn, so the top of this
 * table is what is being worked on right now.
 */
export default async function AdminGamesPage() {
  const games = await listAllGamesWithOwners()

  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex h-12 shrink-0 items-center justify-between gap-2 border-b px-4">
        <span className="font-heading text-sm font-medium">Games</span>
        <Badge variant="secondary">{games.length}</Badge>
      </header>
      <div className="mx-auto w-full max-w-5xl px-6 py-10">
        <h1 className="text-2xl font-semibold tracking-tight">
          {games.length === 1 ? "One game" : `${games.length} games`}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sorted by latest activity. Open a game to watch its preview and thread
          — including while a build is streaming.
        </p>

        {games.length === 0 ? (
          <p className="mt-10 rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            No games yet. They appear here the moment a student describes one.
          </p>
        ) : (
          <div className="mt-8 overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Game</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last activity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {games.map((game) => (
                  <TableRow key={game.id}>
                    <TableCell>
                      <Link
                        href={`/games/${game.id}`}
                        className="font-medium underline-offset-4 hover:underline"
                      >
                        {game.title}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {game.ownerName}
                      {game.ownerUsername && (
                        <span className="text-muted-foreground/70">
                          {" "}
                          · {game.ownerUsername}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {game.hasSandbox ? (
                        <span className="text-muted-foreground">Playable</span>
                      ) : (
                        <Badge variant="secondary">Not built yet</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {TIME_FORMAT.format(game.createdAt)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {TIME_FORMAT.format(game.updatedAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
}
