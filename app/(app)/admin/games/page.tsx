import {
  ArrowDownIcon,
  ArrowUpIcon,
  ArrowUpDownIcon,
  Trash2Icon,
} from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { TablePagination } from "@/components/admin/table-pagination"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  GAMES_PAGE_SIZE,
  listAllGamesWithOwners,
  type AdminGameSortKey,
  type AdminGameStatus,
} from "@/lib/admin/queries"

export const metadata: Metadata = {
  title: "Jeux",
}

const TIME_FORMAT = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
})

const SORTS: { key: AdminGameSortKey; label: string }[] = [
  { key: "title", label: "Jeu" },
  { key: "owner", label: "Propriétaire" },
  { key: "createdAt", label: "Créé le" },
  { key: "updatedAt", label: "Dernière activité" },
]

const STATUSES: { key: AdminGameStatus; label: string }[] = [
  { key: "active", label: "En cours" },
  { key: "trash", label: "Corbeille" },
  { key: "all", label: "Tout" },
]

/**
 * Every game in the class, sortable, filtered and paginated.
 *
 * A row's link opens the game's own page as the admin - the live preview and
 * the chat thread play there exactly as the student sees them, including a
 * turn in progress. Rows from the trash open too: their threads are kept for
 * the records, and only the sandbox behind them is gone.
 */
export default async function AdminGamesPage({
  searchParams,
}: PageProps<"/admin/games">) {
  const params = await searchParams

  const sort = SORTS.some(({ key }) => key === params.sort)
    ? (params.sort as AdminGameSortKey)
    : "updatedAt"
  const dir = params.dir === "asc" ? "asc" : "desc"
  const status = STATUSES.some(({ key }) => key === params.status)
    ? (params.status as AdminGameStatus)
    : "active"
  const page = Math.max(1, Number(params.page) || 1)

  const { rows, total } = await listAllGamesWithOwners({
    page,
    sort,
    dir,
    status,
  })
  const pageCount = Math.max(1, Math.ceil(total / GAMES_PAGE_SIZE))

  // Every link below carries the current sort, direction and filter, so
  // paging never resets them and sorting never resets the page.
  function href(next: {
    page?: number
    sort?: AdminGameSortKey
    dir?: "asc" | "desc"
    status?: AdminGameStatus
  }) {
    const query = new URLSearchParams()
    const nextSort = next.sort ?? sort
    const nextDir = next.dir ?? dir
    const nextPage = next.page ?? 1

    if (nextSort !== "updatedAt") query.set("sort", nextSort)
    if (nextDir !== "desc") query.set("dir", nextDir)
    if ((next.status ?? status) !== "active") {
      query.set("status", next.status ?? status)
    }
    if (nextPage > 1) query.set("page", String(nextPage))

    const qs = query.toString()
    return qs ? `/admin/games?${qs}` : "/admin/games"
  }

  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex h-12 shrink-0 items-center justify-between gap-2 border-b px-4">
        <span className="font-heading text-sm font-medium">Jeux</span>
        <Badge variant="secondary">{total}</Badge>
      </header>
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold tracking-tight">
          {total === 1 ? "1 jeu" : `${total} jeux`}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cliquez sur un en-tête pour trier. Ouvrez un jeu pour suivre son
          aperçu et sa discussion, même pendant une construction.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          {STATUSES.map(({ key, label }) => (
            <Link
              key={key}
              href={href({ status: key })}
              aria-label={`Filtrer : ${label}`}
              className={
                key === status
                  ? "rounded-full border bg-foreground px-3 py-1 text-sm text-background"
                  : "rounded-full border px-3 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted/50"
              }
            >
              {label}
            </Link>
          ))}
        </div>

        {rows.length === 0 ? (
          <p className="mt-10 rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            {status === "trash"
              ? "La corbeille est vide. Un jeu supprimé garde ici son fil complet, pour le suivi."
              : "Aucun jeu pour l'instant. Ils apparaîtront ici dès qu'un élève en décrit un."}
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  {SORTS.map(({ key, label }) => (
                    <TableHead key={key}>
                      <Link
                        href={href({
                          sort: key,
                          dir: sort === key && dir === "desc" ? "asc" : "desc",
                        })}
                        className="inline-flex items-center gap-1 underline-offset-4 hover:underline"
                      >
                        {label}
                        {sort === key ? (
                          dir === "desc" ? (
                            <ArrowDownIcon className="size-3.5" />
                          ) : (
                            <ArrowUpIcon className="size-3.5" />
                          )
                        ) : (
                          <ArrowUpDownIcon className="size-3.5 opacity-40" />
                        )}
                      </Link>
                    </TableHead>
                  ))}
                  <TableHead>État</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((game) => (
                  <TableRow
                    key={game.id}
                    className={game.deletedAt ? "opacity-60" : undefined}
                  >
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
                          ({game.ownerUsername})
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {TIME_FORMAT.format(game.createdAt)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {TIME_FORMAT.format(game.updatedAt)}
                    </TableCell>
                    <TableCell>
                      {game.deletedAt ? (
                        <Badge variant="destructive">
                          <Trash2Icon />
                          Corbeille
                        </Badge>
                      ) : game.hasSandbox ? (
                        <span className="text-muted-foreground">Jouable</span>
                      ) : (
                        <Badge variant="secondary">Pas encore construit</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <TablePagination
          page={page}
          pageCount={pageCount}
          makeHref={(next) => href({ page: next })}
        />
      </div>
    </div>
  )
}
