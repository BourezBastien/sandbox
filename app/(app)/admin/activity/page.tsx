import { ScrollTextIcon } from "lucide-react"
import type { Metadata } from "next"

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
import { AUDIT_PAGE_SIZE, listAuditLog } from "@/lib/admin/queries"
import { AUDIT_ACTION_LABELS, type AuditAction } from "@/lib/audit"

export const metadata: Metadata = {
  title: "Journal",
}

const TIME_FORMAT = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
})

function actionLabel(action: string) {
  return AUDIT_ACTION_LABELS[action as AuditAction] ?? action
}

/**
 * The activity journal: every recorded event, newest first.
 *
 * This is the school's record - games created, renamed or deleted, turns
 * played, accounts managed - kept in the database whatever else was cleaned
 * up along the way. Message contents are not here; they stay on each game's
 * row, where the whole thread lives on.
 */
export default async function AdminActivityPage({
  searchParams,
}: PageProps<"/admin/activity">) {
  const params = await searchParams
  const page = Math.max(1, Number(params.page) || 1)

  const { rows, total } = await listAuditLog({ page })
  const pageCount = Math.max(1, Math.ceil(total / AUDIT_PAGE_SIZE))

  function href(next: number) {
    return next > 1 ? `/admin/activity?page=${next}` : "/admin/activity"
  }

  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex h-12 shrink-0 items-center justify-between gap-2 border-b px-4">
        <span className="font-heading text-sm font-medium">Journal</span>
        <Badge variant="secondary">{total}</Badge>
      </header>
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <ScrollTextIcon className="size-5 text-muted-foreground" />
          Journal d&apos;activité
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tout ce qui s&apos;est passé, dans l&apos;ordre : jeux créés, renommés
          ou supprimés, tours joués, comptes gérés. Les messages eux mêmes
          restent dans le fil de chaque jeu.
        </p>

        {rows.length === 0 ? (
          <p className="mt-10 rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            Rien pour l&apos;instant. Chaque action laissera ici sa trace.
          </p>
        ) : (
          <div className="mt-8 overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quand</TableHead>
                  <TableHead>Qui</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Détail</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {TIME_FORMAT.format(entry.createdAt)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {entry.actorLabel}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {actionLabel(entry.action)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {entry.detail ?? ""}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <TablePagination page={page} pageCount={pageCount} makeHref={href} />
      </div>
    </div>
  )
}
