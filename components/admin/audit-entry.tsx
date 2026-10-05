"use client"

import {
  ChevronDownIcon,
  ChevronRightIcon,
  Gamepad2Icon,
  UsersIcon,
} from "lucide-react"
import Link from "next/link"
import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { TableCell, TableRow } from "@/components/ui/table"
import { AUDIT_ACTION_LABELS, type AuditAction } from "@/lib/audit-actions"

const TIME_FORMAT = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
})

// The expanded row is where precision matters more than brevity: date
// complete, seconde incluse.
const FULL_TIME_FORMAT = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "full",
  timeStyle: "medium",
})

/**
 * One journal line, clickable to unfold everything recorded about the event:
 * the full timestamp, the raw action key, the target and its id, the actor's
 * id, and the detail line in full.
 *
 * For events about a game, the unfolded row links to that game's page - which
 * is where "everything" really lives, since the whole discussion thread is
 * kept on the game row, archived games included. For events about an account,
 * it links back to the accounts page.
 */
export function AuditEntry({
  entry,
}: {
  entry: {
    id: string
    createdAt: Date | string
    actorId: string | null
    actorLabel: string
    action: string
    targetType: string | null
    targetId: string | null
    detail: string | null
  }
}) {
  const [open, setOpen] = useState(false)

  const createdAt = new Date(entry.createdAt)
  const label = AUDIT_ACTION_LABELS[entry.action as AuditAction] ?? entry.action

  return (
    <>
      <TableRow
        className="cursor-pointer"
        onClick={() => setOpen((value) => !value)}
      >
        <TableCell className="whitespace-nowrap text-muted-foreground">
          {TIME_FORMAT.format(createdAt)}
        </TableCell>
        <TableCell className="font-medium">{entry.actorLabel}</TableCell>
        <TableCell>
          <Badge variant="secondary">{label}</Badge>
        </TableCell>
        <TableCell className="text-muted-foreground">
          {entry.detail ?? ""}
        </TableCell>
        <TableCell className="w-10">
          <span className="sr-only">
            {open ? "Replier" : "Déplier"} la ligne
          </span>
          {open ? (
            <ChevronDownIcon className="size-4 text-muted-foreground" />
          ) : (
            <ChevronRightIcon className="size-4 text-muted-foreground" />
          )}
        </TableCell>
      </TableRow>

      {open && (
        <TableRow className="bg-muted/30 hover:bg-muted/30">
          <TableCell colSpan={5} className="px-4 py-4">
            <dl className="grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Horodatage complet">
                {FULL_TIME_FORMAT.format(createdAt)}
              </Field>
              <Field label="Action (code brut)">{entry.action}</Field>
              <Field label="Identifiant de l'acteur">
                {entry.actorId ?? "Système (aucun compte)"}
              </Field>
              <Field label="Cible">
                {entry.targetType
                  ? `${libelleCible(entry.targetType)} · ${entry.targetId ?? "inconnu"}`
                  : "Aucune"}
              </Field>
              <Field label="Détail" full>
                {entry.detail ?? "Aucun détail supplémentaire"}
              </Field>
            </dl>

            {entry.targetType === "game" && entry.targetId && (
              <Link
                href={`/games/${entry.targetId}`}
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium underline underline-offset-4"
              >
                <Gamepad2Icon className="size-4" />
                Ouvrir ce jeu et son fil complet
              </Link>
            )}
            {entry.targetType === "user" && (
              <Link
                href="/admin/users"
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium underline underline-offset-4"
              >
                <UsersIcon className="size-4" />
                Voir les comptes
              </Link>
            )}
          </TableCell>
        </TableRow>
      )}
    </>
  )
}

function libelleCible(targetType: string) {
  if (targetType === "game") return "Jeu"
  if (targetType === "user") return "Compte"
  return targetType
}

function Field({
  label,
  full,
  children,
}: {
  label: string
  full?: boolean
  children: React.ReactNode
}) {
  return (
    <div className={full ? "sm:col-span-2 lg:col-span-3" : undefined}>
      <dt className="text-xs tracking-wide text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="mt-0.5 break-words">{children}</dd>
    </div>
  )
}
