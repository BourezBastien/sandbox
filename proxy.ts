import { NextResponse, type NextRequest } from "next/server"

/**
 * A cheap presence check, not the boundary: pages and server actions resolve
 * the real session against the database (see `@/lib/auth`). All this does is
 * move a signed-out visitor to sign-in before a page renders - Next 16's docs
 * are explicit that Proxy must never be the only guard, because Server
 * Functions are POSTs to page routes and a matcher change can silently skip
 * them.
 *
 * `/api` is left out of the matcher entirely: the auth route must answer
 * anonymous requests, and the preview route already fails closed on its own
 * (a game it cannot scope to the caller is a 404, not a leak).
 */
const PUBLIC_PATHS = ["/sign-in", "/install"]

// The cookie is unprefixed over plain HTTP (local dev) and `__Secure-`-prefixed
// in production, so both names mean "has a session".
function hasSessionCookie(request: NextRequest) {
  return (
    request.cookies.has("better-auth.session_token") ||
    request.cookies.has("__Secure-better-auth.session_token")
  )
}

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isPublic = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  )

  if (!isPublic && !hasSessionCookie(request)) {
    return NextResponse.redirect(new URL("/sign-in", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!monitoring|api|_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
  ],
}
