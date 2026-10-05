import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import Link from "next/link"

/**
 * Server-rendered pagination for the admin tables: links carrying the query
 * string, so a page is a URL - shareable, bookmarkable, and no client state
 * to keep in step with the sort or the filter.
 *
 * `makeHref` builds the target page's url from the current params, dropping
 * the page number when it is 1 so the canonical first page stays clean.
 */
export function TablePagination({
  page,
  pageCount,
  makeHref,
}: {
  page: number
  pageCount: number
  makeHref: (page: number) => string
}) {
  if (pageCount <= 1) {
    return null
  }

  return (
    <nav
      className="mt-4 flex items-center justify-between gap-2"
      aria-label="Pagination"
    >
      <PageLink
        href={makeHref(Math.max(1, page - 1))}
        ariaDisabled={page === 1}
      >
        <ChevronLeftIcon />
        Précédent
      </PageLink>
      <span className="text-sm text-muted-foreground tabular-nums">
        Page {page} sur {pageCount}
      </span>
      <PageLink
        href={makeHref(Math.min(pageCount, page + 1))}
        ariaDisabled={page === pageCount}
      >
        Suivant
        <ChevronRightIcon />
      </PageLink>
    </nav>
  )
}

function PageLink({
  href,
  ariaDisabled,
  children,
}: {
  href: string
  ariaDisabled: boolean
  children: React.ReactNode
}) {
  if (ariaDisabled) {
    return (
      <span className="flex items-center gap-1 text-sm text-muted-foreground/50">
        {children}
      </span>
    )
  }

  return (
    <Link
      href={href}
      className="flex items-center gap-1 text-sm underline-offset-4 hover:underline"
    >
      {children}
    </Link>
  )
}
