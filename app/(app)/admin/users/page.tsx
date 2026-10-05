import type { Metadata } from "next"

import { TablePagination } from "@/components/admin/table-pagination"
import { CreateUserButton, UserActions } from "@/components/admin/user-actions"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { USERS_PAGE_SIZE, listUsersWithGameCounts } from "@/lib/admin/queries"

export const metadata: Metadata = {
  title: "Comptes",
}

/** How a roster reads: "3 oct. 2026, 14:05". */
const DATE_FORMAT = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
})

export default async function AdminUsersPage({
  searchParams,
}: PageProps<"/admin/users">) {
  const params = await searchParams
  const page = Math.max(1, Number(params.page) || 1)

  const { rows, total } = await listUsersWithGameCounts({ page })
  const pageCount = Math.max(1, Math.ceil(total / USERS_PAGE_SIZE))

  function href(next: number) {
    return next > 1 ? `/admin/users?page=${next}` : "/admin/users"
  }

  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex h-12 shrink-0 items-center justify-between gap-2 border-b px-4">
        <span className="font-heading text-sm font-medium">Comptes</span>
        <CreateUserButton />
      </header>
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold tracking-tight">
          {total === 1 ? "1 compte" : `${total} comptes`}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Les comptes se connectent avec l&apos;identifiant et le mot de passe
          définis ici. Bloquer un compte le déconnecte immédiatement.
        </p>

        <div className="mt-8 overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Élève</TableHead>
                <TableHead>Identifiant</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Jeux</TableHead>
                <TableHead>Créé le</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.username ?? ""}
                  </TableCell>
                  <TableCell>
                    {user.role === "admin" ? (
                      <Badge>Admin</Badge>
                    ) : (
                      <span className="text-muted-foreground">Élève</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {user.banned ? (
                      <Badge variant="destructive">Bloqué</Badge>
                    ) : (
                      <span className="text-muted-foreground">Actif</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {user.gameCount}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {DATE_FORMAT.format(user.createdAt)}
                  </TableCell>
                  <TableCell>
                    <UserActions
                      userId={user.id}
                      name={user.name}
                      role={user.role}
                      banned={Boolean(user.banned)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <TablePagination page={page} pageCount={pageCount} makeHref={href} />
      </div>
    </div>
  )
}
