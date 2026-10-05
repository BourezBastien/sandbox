"use client"

import {
  BanIcon,
  CircleAlertIcon,
  EllipsisIcon,
  KeyRoundIcon,
  LogOutIcon,
  PlusIcon,
  ShieldCheckIcon,
  Trash2Icon,
} from "lucide-react"
import { useState, useTransition } from "react"

import {
  banUserAccount,
  createStudentAccount,
  forceSignOut,
  removeUserAccount,
  resetUserPassword,
  unbanUserAccount,
} from "@/lib/admin/actions"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"

/**
 * The error text every dialog here falls back to. Server Action errors arrive
 * stripped of their message in production, so the thrown message is only ever
 * a bonus in dev — the copy assumes the worst case and says what to do next.
 */
const GENERIC_ERROR = "That did not work. Try again."

/** The create-account dialog, opened from the accounts page header. */
export function CreateUserButton() {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleOpenChange(next: boolean) {
    if (!next && !isPending) {
      setOpen(false)
      setError(null)
    } else if (next) {
      setOpen(true)
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const form = new FormData(event.currentTarget)
    const username = String(form.get("username") ?? "")
    const name = String(form.get("name") ?? "")
    const password = String(form.get("password") ?? "")

    startTransition(async () => {
      try {
        await createStudentAccount({ username, name, password })
        setOpen(false)
      } catch (err) {
        setError(
          err instanceof Error && err.message !== "Unauthorized"
            ? err.message
            : GENERIC_ERROR
        )
      }
    })
  }

  return (
    <>
      <Button size="sm" onClick={() => handleOpenChange(true)}>
        <PlusIcon />
        New account
      </Button>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <DialogHeader>
              <DialogTitle>New student account</DialogTitle>
              <DialogDescription>
                The student signs in with this username and password. They can
                be changed later from the same table.
              </DialogDescription>
            </DialogHeader>
            <Field>
              <FieldLabel htmlFor="create-username">Username</FieldLabel>
              <Input
                id="create-username"
                name="username"
                autoCapitalize="none"
                spellCheck={false}
                minLength={3}
                disabled={isPending}
                autoFocus
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="create-name">Student name</FieldLabel>
              <Input
                id="create-name"
                name="name"
                disabled={isPending}
                placeholder="Optional — defaults to the username"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="create-password">Password</FieldLabel>
              <Input
                id="create-password"
                name="password"
                type="password"
                minLength={8}
                disabled={isPending}
                required
              />
            </Field>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>
                Cancel
              </DialogClose>
              <Button type="submit" disabled={isPending} focusableWhenDisabled>
                {isPending && <Spinner />}
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

/** The per-row menu: everything an account can be put through. */
export function UserActions({
  userId,
  name,
  role,
  banned,
}: {
  userId: string
  name: string
  role: string
  banned: boolean
}) {
  const [dialog, setDialog] = useState<"password" | "block" | "delete" | null>(
    null
  )
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function openDialog(next: "password" | "block" | "delete") {
    setError(null)
    setDialog(next)
  }

  function handleOpenChange(open: boolean) {
    if (!open && !isPending) {
      setDialog(null)
    }
  }

  function run(action: () => Promise<void>, closeOnError = false) {
    setError(null)

    startTransition(async () => {
      try {
        await action()
        setDialog(null)
      } catch (err) {
        setError(
          err instanceof Error && err.message !== "Unauthorized"
            ? err.message
            : GENERIC_ERROR
        )
        if (closeOnError) {
          setDialog(null)
        }
      }
    })
  }

  const isAdmin = role === "admin"

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={`Actions for ${name}`}
          render={<Button variant="ghost" size="icon-sm" />}
        >
          <EllipsisIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => openDialog("password")}>
            <KeyRoundIcon />
            Reset password
          </DropdownMenuItem>
          {/* A confirmation would only slow down the mid-class "put that
              away" — and unlike a block, everything works again on the next
              sign-in. */}
          <DropdownMenuItem onClick={() => run(() => forceSignOut({ userId }))}>
            <LogOutIcon />
            Sign out everywhere
          </DropdownMenuItem>
          {banned ? (
            <DropdownMenuItem
              onClick={() => run(() => unbanUserAccount({ userId }))}
            >
              <ShieldCheckIcon />
              Unblock
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => openDialog("block")}>
              <BanIcon />
              Block
            </DropdownMenuItem>
          )}
          {!isAdmin && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => openDialog("delete")}
              >
                <Trash2Icon />
                Delete
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Reset password */}
      <Dialog open={dialog === "password"} onOpenChange={handleOpenChange}>
        <DialogContent>
          <form
            onSubmit={(event) => {
              event.preventDefault()
              const form = new FormData(event.currentTarget)
              const password = String(form.get("password") ?? "")

              run(() => resetUserPassword({ userId, password }))
            }}
            className="grid gap-4"
          >
            <DialogHeader>
              <DialogTitle>Reset password for {name}</DialogTitle>
              <DialogDescription>
                Every tab this student is signed in on is signed out with the
                change.
              </DialogDescription>
            </DialogHeader>
            <Field>
              <FieldLabel htmlFor="reset-password">New password</FieldLabel>
              <Input
                id="reset-password"
                name="password"
                type="password"
                minLength={8}
                disabled={isPending}
                autoFocus
                required
              />
            </Field>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>
                Cancel
              </DialogClose>
              <Button type="submit" disabled={isPending} focusableWhenDisabled>
                {isPending && <Spinner />}
                Set password
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Block */}
      <AlertDialog open={dialog === "block"} onOpenChange={handleOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <BanIcon className="text-destructive" />
            </AlertDialogMedia>
            <AlertDialogTitle>Block {name}?</AlertDialogTitle>
            <AlertDialogDescription>
              They are signed out immediately, and any build running right now
              is stopped. Unblocking lets them sign back in with everything
              still in place.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => run(() => banUserAccount({ userId }))}
              disabled={isPending}
              focusableWhenDisabled
            >
              {isPending && <Spinner />}
              Block
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete */}
      <AlertDialog open={dialog === "delete"} onOpenChange={handleOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <Trash2Icon className="text-destructive" />
            </AlertDialogMedia>
            <AlertDialogTitle>Delete {name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Their games, their threads, and the sandboxes those games were
              built in all go with the account. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error && <AlertError>{error}</AlertError>}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => run(() => removeUserAccount({ userId }))}
              disabled={isPending}
              focusableWhenDisabled
            >
              {isPending && <Spinner />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function AlertError({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-2 text-sm text-destructive">
      <CircleAlertIcon className="size-4 shrink-0" />
      {children}
    </p>
  )
}
