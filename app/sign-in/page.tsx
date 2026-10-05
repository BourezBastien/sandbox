import type { Metadata } from "next"
import Image from "next/image"

import { SignInForm } from "@/components/sign-in-form"

export const metadata: Metadata = {
  title: "Connexion",
}

export default function SignInPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-8 p-6">
      <div className="flex items-center gap-2">
        <Image
          src="/logo.svg"
          alt="Sandbox"
          width={24}
          height={24}
          className="size-6"
        />
        <span className="font-logo text-xl">Sandbox</span>
      </div>
      <SignInForm />
    </div>
  )
}
