"use client"

import { CircleAlertIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { authClient } from "@/lib/auth-client"

/**
 * Username + password, against Better Auth's username plugin.
 *
 * Accounts are created by the admin - there is no sign-up link to offer, which
 * is why the failure copy says to check with whoever runs the class rather
 * than pointing at a reset flow that does not exist.
 */
export function SignInForm() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    startTransition(async () => {
      const { error } = await authClient.signIn.username({
        username,
        password,
      })

      if (error) {
        setError(
          "Cet identifiant et ce mot de passe ne vont pas ensemble. Vérifie les deux et réessaie."
        )
        return
      }

      router.push("/")
      router.refresh()
    })
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Bon retour !</h1>
        <p className="mt-1 text-sm text-balance text-muted-foreground">
          Connecte-toi avec le compte que ton professeur a créé pour toi.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="grid gap-4">
        <Field>
          <FieldLabel htmlFor="username">Identifiant</FieldLabel>
          <Input
            id="username"
            name="username"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            disabled={isPending}
            autoFocus
            required
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="password">Mot de passe</FieldLabel>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={isPending}
            required
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
          disabled={isPending || !username.trim() || !password}
          focusableWhenDisabled
        >
          {isPending && <Spinner />}
          Se connecter
        </Button>
      </form>
    </div>
  )
}
