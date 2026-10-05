import type { Metadata } from "next"
import Image from "next/image"
import { redirect } from "next/navigation"

import { InstallForm } from "@/components/install-form"
import { adminExists } from "@/lib/admin/queries"

export const metadata: Metadata = {
  title: "Installation",
}

// The answer changes the moment the admin exists, and the check is a database
// query - never something to freeze into a build-time page.
export const dynamic = "force-dynamic"

export default async function InstallPage() {
  // The page exists for exactly one deployment-time moment: before the first
  // admin. After that it is a dead end that says so, rather than a form that
  // throws - anyone landing here post-install has nothing to do and no
  // reason to see an error about it.
  const installed = await adminExists()

  if (installed) {
    redirect("/sign-in")
  }

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
      <InstallForm />
    </div>
  )
}
