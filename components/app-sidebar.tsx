"use client"

import {
  LogOutIcon,
  MessageSquareIcon,
  ShieldIcon,
  SquarePenIcon,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useRouter } from "next/navigation"
import { useTransition } from "react"

import { GameMenu } from "@/components/game-menu"
import { Empty, EmptyDescription } from "@/components/ui/empty"
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Spinner } from "@/components/ui/spinner"
import { authClient } from "@/lib/auth-client"
import type { Game } from "@/lib/db/schema"

export function AppSidebar({
  games,
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  games: Game[]
  user: { name: string; username?: string | null; role?: string | null }
}) {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="flex-row items-center justify-between group-data-[collapsible=icon]:justify-center">
        <Link
          href="/"
          className="flex items-center gap-2 group-data-[collapsible=icon]:hidden"
        >
          <Image
            src="/logo.svg"
            alt="Sandbox"
            width={20}
            height={20}
            className="size-5"
          />
          <span className="font-logo text-base">Sandbox</span>
        </Link>
        <SidebarTrigger />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={pathname === "/"}
                render={<Link href="/" />}
              >
                <SquarePenIcon />
                <span>Nouveau jeu</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Récents</SidebarGroupLabel>
          <SidebarGroupContent>
            {games.length === 0 ? (
              <Empty className="border p-2 group-data-[collapsible=icon]:hidden">
                <EmptyDescription className="text-xs">
                  Tes jeux apparaîtront ici.
                </EmptyDescription>
              </Empty>
            ) : (
              <SidebarMenu className="group-data-[collapsible=icon]:hidden">
                {games.map((game) => (
                  <SidebarMenuItem key={game.id}>
                    <SidebarMenuButton
                      isActive={pathname === `/games/${game.id}`}
                      render={<Link href={`/games/${game.id}`} />}
                    >
                      <span>{game.title}</span>
                    </SidebarMenuButton>
                    {/* The same menu the game's own header has. Rendered as a
                        `SidebarMenuAction` so it sits inside the row rather
                        than beside it: the row is a link, and a button nested
                        in one would be a link that is sometimes not. Hidden
                        until the row is hovered or focused - and, once the
                        menu is open, kept visible by the trigger's
                        `aria-expanded`. */}
                    <GameMenu
                      gameId={game.id}
                      title={game.title}
                      trigger={<SidebarMenuAction showOnHover />}
                    />
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            )}
            <SidebarMenu className="hidden group-data-[collapsible=icon]:flex">
              <SidebarMenuItem>
                <Popover>
                  <PopoverTrigger
                    render={
                      <SidebarMenuButton>
                        <MessageSquareIcon />
                        <span>Récents</span>
                      </SidebarMenuButton>
                    }
                  />
                  <PopoverContent
                    side="right"
                    align="start"
                    className="w-56 gap-1.5 p-1.5"
                  >
                    <PopoverHeader className="px-2 pt-1">
                      <PopoverTitle className="text-xs text-muted-foreground">
                        Récents
                      </PopoverTitle>
                    </PopoverHeader>
                    {games.length === 0 ? (
                      <Empty className="border p-2">
                        <EmptyDescription className="text-xs">
                          Tes jeux apparaîtront ici.
                        </EmptyDescription>
                      </Empty>
                    ) : (
                      <SidebarMenu>
                        {games.map((game) => (
                          <SidebarMenuItem key={game.id}>
                            <PopoverClose
                              nativeButton={false}
                              render={
                                <SidebarMenuButton
                                  isActive={pathname === `/games/${game.id}`}
                                  render={<Link href={`/games/${game.id}`} />}
                                >
                                  <span>{game.title}</span>
                                </SidebarMenuButton>
                              }
                            />
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                    )}
                  </PopoverContent>
                </Popover>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        {user.role === "admin" && (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={
                  pathname === "/admin" || pathname.startsWith("/admin/")
                }
                render={<Link href="/admin" />}
              >
                <ShieldIcon />
                <span>Administration</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
        <UserMenu name={user.name} username={user.username ?? undefined} />
      </SidebarFooter>
    </Sidebar>
  )
}

/** Who is signed in, and the way out. */
function UserMenu({ name, username }: { name: string; username?: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // The session cookie dies server-side with the sign-out call; the push is
  // what moves this tab somewhere a signed-out user belongs.
  function handleSignOut() {
    startTransition(async () => {
      await authClient.signOut()
      router.push("/sign-in")
    })
  }

  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")

  return (
    <div className="flex items-center gap-2 p-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0">
      <span
        aria-hidden
        className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-accent text-xs font-medium text-sidebar-accent-foreground"
      >
        {initials || "?"}
      </span>
      <span className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
        <span className="block truncate text-sm font-medium">{name}</span>
        {username && (
          <span className="block truncate text-xs text-muted-foreground">
            {username}
          </span>
        )}
      </span>
      <button
        type="button"
        onClick={handleSignOut}
        disabled={isPending}
        aria-label="Se déconnecter"
        className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors group-data-[collapsible=icon]:hidden hover:bg-sidebar-accent hover:text-sidebar-accent-foreground disabled:opacity-50"
      >
        {isPending ? <Spinner /> : <LogOutIcon className="size-4" />}
      </button>
    </div>
  )
}
