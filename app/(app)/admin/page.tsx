import { Gamepad2Icon, ShieldIcon, UsersIcon } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { adminStats } from "@/lib/admin/queries"

export const metadata: Metadata = {
  title: "Administration",
}

/**
 * The admin's home: the shape of the deployment at a glance, and the two
 * places to go do something about it.
 */
export default async function AdminPage() {
  const stats = await adminStats()

  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
        <ShieldIcon className="size-4 text-muted-foreground" />
        <span className="font-heading text-sm font-medium">Administration</span>
      </header>
      <div className="mx-auto w-full max-w-5xl px-6 py-10">
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every account, game and sandbox on this deployment.
        </p>

        <dl className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Accounts" value={stats.users} href="/admin/users" />
          <Stat label="Blocked" value={stats.banned} href="/admin/users" />
          <Stat label="Games" value={stats.games} href="/admin/games" />
          <Stat label="Sandboxes" value={stats.sandboxes} href="/admin/games" />
        </dl>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <Link
            href="/admin/users"
            className="flex flex-col gap-2 rounded-lg border p-4 transition-colors hover:bg-muted/50"
          >
            <span className="flex items-center gap-2 font-medium">
              <UsersIcon className="size-4" />
              Accounts
            </span>
            <span className="text-sm text-muted-foreground">
              Create student accounts, reset passwords, block in real time.
            </span>
          </Link>
          <Link
            href="/admin/games"
            className="flex flex-col gap-2 rounded-lg border p-4 transition-colors hover:bg-muted/50"
          >
            <span className="flex items-center gap-2 font-medium">
              <Gamepad2Icon className="size-4" />
              Games
            </span>
            <span className="text-sm text-muted-foreground">
              Every game in the class, with its owner — open one to watch it
              being built.
            </span>
          </Link>
        </div>
      </div>
    </div>
  )
}

function Stat({
  label,
  value,
  href,
}: {
  label: string
  value: number
  href: string
}) {
  return (
    <Link
      href={href}
      className="flex flex-col gap-1 rounded-lg border p-4 transition-colors hover:bg-muted/50"
    >
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="font-heading text-3xl font-semibold tracking-tight tabular-nums">
        {value}
      </dd>
    </Link>
  )
}
