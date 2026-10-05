import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { requireSession } from "@/lib/auth"
import { listGames } from "@/lib/games/queries"

export default async function AppLayout({ children }: LayoutProps<"/">) {
  // The one guard for every page in this group: the sidebar below needs the
  // signed-in user anyway, and a caller without a session has nothing to see
  // here. Banned callers never get this far - banning revokes every session.
  const { user } = await requireSession()
  const games = await listGames()

  return (
    <SidebarProvider>
      <AppSidebar
        games={games}
        user={{ name: user.name, username: user.username, role: user.role }}
      />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  )
}
