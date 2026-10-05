import type { Metadata } from "next"

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
import { listUsersWithGameCounts } from "@/lib/admin/queries"

export const metadata: Metadata = {
  title: "Accounts",
}

/** How a roster reads: "3 Oct 2026, 14:05". */
const DATE_FORMAT = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
})

export default async function AdminUsersPage() {
  const users = await listUsersWithGameCounts()

  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex h-12 shrink-0 items-center justify-between gap-2 border-b px-4">
        <span className="font-heading text-sm font-medium">Accounts</span>
        <CreateUserButton />
      </header>
      <div className="mx-auto w-full max-w-5xl px-6 py-10">
        <h1 className="text-2xl font-semibold tracking-tight">
          {users.length} {users.length === 1 ? "account" : "accounts"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Accounts sign in with the username and password set here. Blocking an
          account disconnects it immediately.
        </p>

        <div className="mt-8 overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Games</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.username ?? "—"}
                  </TableCell>
                  <TableCell>
                    {user.role === "admin" ? (
                      <Badge>Admin</Badge>
                    ) : (
                      <span className="text-muted-foreground">Student</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {user.banned ? (
                      <Badge variant="destructive">Blocked</Badge>
                    ) : (
                      <span className="text-muted-foreground">Active</span>
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
      </div>
    </div>
  )
}
