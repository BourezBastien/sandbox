import { redirect } from "next/navigation"

import { requireSession } from "@/lib/auth"

/**
 * The guard for every admin page: signed in *and* the admin role.
 *
 * A student hitting /admin by hand is redirected home rather than shown a 404
 * - the pages exist, they are just not theirs. Nothing sensitive renders in
 * this layout; the guard is here so the whole group fails closed in one
 * place, with the actions below it checking again on their own.
 */
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const { user } = await requireSession()

  if (user.role !== "admin") {
    redirect("/")
  }

  return <>{children}</>
}
