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
 * a bonus in dev - the copy assumes the worst case and says what to do next.
 */
const GENERIC_ERROR = "Cela n'a pas fonctionné. Réessayez."

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
        Nouveau compte
      </Button>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <DialogHeader>
              <DialogTitle>Nouveau compte élève</DialogTitle>
              <DialogDescription>
                L&apos;élève se connecte avec cet identifiant et ce mot de passe. Ils
                peuvent être modifiés plus tard depuis ce même tableau.
              </DialogDescription>
            </DialogHeader>
            <Field>
              <FieldLabel htmlFor="create-username">Identifiant</FieldLabel>
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
              <FieldLabel htmlFor="create-name">Nom de l&apos;élève</FieldLabel>
              <Input
                id="create-name"
                name="name"
                disabled={isPending}
                placeholder="Facultatif. Par défaut : l'identifiant"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="create-password">Mot de passe</FieldLabel>
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
                Annuler
              </DialogClose>
              <Button type="submit" disabled={isPending} focusableWhenDisabled>
                {isPending && <Spinner />}
                Créer
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
          aria-label={`Actions de ${name}`}
          render={<Button variant="ghost" size="icon-sm" />}
        >
          <EllipsisIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => openDialog("password")}>
            <KeyRoundIcon />
            Réinitialiser le mot de passe
          </DropdownMenuItem>
          {/* A confirmation would only slow down the mid-class "put that
              away" - and unlike a block, everything works again on the next
              sign-in. */}
          <DropdownMenuItem onClick={() => run(() => forceSignOut({ userId }))}>
            <LogOutIcon />
            Déconnecter partout
          </DropdownMenuItem>
          {banned ? (
            <DropdownMenuItem
              onClick={() => run(() => unbanUserAccount({ userId }))}
            >
              <ShieldCheckIcon />
              Débloquer
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => openDialog("block")}>
              <BanIcon />
              Bloquer
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
                Supprimer
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
              <DialogTitle>Réinitialiser le mot de passe de {name}</DialogTitle>
              <DialogDescription>
                Tous les onglets où cet élève est connecté seront déconnectés
                par la même occasion.
              </DialogDescription>
            </DialogHeader>
            <Field>
              <FieldLabel htmlFor="reset-password">
                Nouveau mot de passe
              </FieldLabel>
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
                Annuler
              </DialogClose>
              <Button type="submit" disabled={isPending} focusableWhenDisabled>
                {isPending && <Spinner />}
                Définir le mot de passe
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
            <AlertDialogTitle>Bloquer {name} ?</AlertDialogTitle>
            <AlertDialogDescription>
              Il est déconnecté immédiatement et toute construction en cours est
              arrêtée. Le déblocage lui permet de se reconnecter, tout restant
              en place.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => run(() => banUserAccount({ userId }))}
              disabled={isPending}
              focusableWhenDisabled
            >
              {isPending && <Spinner />}
              Bloquer
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
            <AlertDialogTitle>Supprimer {name} ?</AlertDialogTitle>
            <AlertDialogDescription>
              Ses jeux, ses discussions et les bacs à sable dans lesquels ils
              ont été construits disparaissent avec le compte. Cette action est
              irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error && <AlertError>{error}</AlertError>}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => run(() => removeUserAccount({ userId }))}
              disabled={isPending}
              focusableWhenDisabled
            >
              {isPending && <Spinner />}
              Supprimer
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
