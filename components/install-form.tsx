"use client"

import { CircleAlertIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { installAdmin } from "@/lib/admin/actions"

/**
 * The one-time creation of the admin account, on /install.
 *
 * The server re-checks that no admin exists before creating one — this form is
 * only the first door, not the lock. On success it goes to sign-in rather
 * than signing the new admin in directly, so the credential it just created
 * is the one that gets used from the very first click.
 */
export function InstallForm() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (password !== confirm) {
      setError("Les deux mots de passe ne correspondent pas.")
      return
    }

    startTransition(async () => {
      try {
        await installAdmin({ username, name, password })
        router.push("/sign-in")
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Le compte administrateur n'a pas pu être créé. Réessayez."
        )
      }
    })
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Créez votre compte administrateur
        </h1>
        <p className="mt-1 text-sm text-balance text-muted-foreground">
          Cette étape unique crée le compte qui gère tout le reste. Elle ne peut
          pas être refaite.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="grid gap-4">
        <Field>
          <FieldLabel htmlFor="install-username">
            Identifiant administrateur
          </FieldLabel>
          <Input
            id="install-username"
            name="username"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            disabled={isPending}
            autoFocus
            required
            minLength={3}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="install-name">Nom affiché</FieldLabel>
          <Input
            id="install-name"
            name="name"
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={isPending}
            placeholder="Facultatif — par défaut, l'identifiant"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="install-password">Mot de passe</FieldLabel>
          <Input
            id="install-password"
            name="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={isPending}
            required
            minLength={8}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="install-confirm">
            Confirmer le mot de passe
          </FieldLabel>
          <Input
            id="install-confirm"
            name="confirm"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            disabled={isPending}
            required
            minLength={8}
          />
        </Field>
        {error && (
          <Alert variant="destructive">
            <CircleAlertIcon />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Button
          type="submit"
          disabled={isPending || !username.trim() || !password || !confirm}
          focusableWhenDisabled
        >
          {isPending && <Spinner />}
          Créer le compte administrateur
        </Button>
      </form>
    </div>
  )
}
