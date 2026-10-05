<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes - APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project overview

Sandbox (school edition) is an agentic three.js game builder for a class: a
student describes a game in chat, a Trigger.dev chat agent (`trigger/chat.ts`,
GLM via z.ai's Anthropic-compatible endpoint and the AI SDK) writes real source
files into a per-game Daytona cloud sandbox (`lib/daytona/`), and the browser
plays the result in a live iframe preview. Stack: Next.js 16 App Router,
React 19, Better Auth (username/password, admin-created accounts, roles
admin/user), self-hosted Postgres via Drizzle, Sentry (optional). There is no
billing and no self sign-up.

- `app/` - routes. `(app)/` is the signed-in space (home, games, `/admin`);
  `install/` is the one-time admin bootstrap; `api/auth/[...all]` serves Better
  Auth; `api/games/[id]/preview` serves the live preview from the sandbox.
- `components/` - app components; `components/ui/` is shadcn (style `base-nova`).
- `lib/auth.ts` (+ `lib/auth-client.ts`) - Better Auth server/browser setup.
- `lib/admin/` - admin queries and server actions (accounts, ban, reset).
- `lib/games/` - agent logic: instructions, tools, chat store, model catalog,
  and the seeded engine files copied into every sandbox.
- `lib/db/` - Drizzle schema and client. `trigger/` - Trigger.dev tasks;
  `trigger/init.ts` runs before every task (Sentry for the worker).

# Commands

```bash
npm run dev            # Next.js dev server
npm run trigger:dev    # Trigger.dev worker - game building needs it running
npm run typecheck      # tsc --noEmit
npm run lint           # eslint
npm run format         # prettier --write
npm run db:push        # apply schema changes (see below)
npm run db:studio      # Drizzle Studio
```

No test framework is configured. Run `npx next typegen` after adding routes
so `PageProps`/`LayoutProps`/`RouteContext` resolve.

# Database schema changes

This project is in active development. There is no production data to preserve
across schema changes (fresh installs run `/install` and recreate accounts).

**Never run `drizzle-kit migrate` or `drizzle-kit generate`.** Do not create
migration files, and do not add a `db:migrate` or `db:generate` script.

Apply schema changes by editing `lib/db/schema.ts` and running:

```bash
npm run db:push
```

`db:push` diffs the schema against the database and applies the change
directly. If a change is destructive, Drizzle Kit will prompt - accept it and
move on. When a change replaces a table outright, drop the obsolete table
first, then push - that removes the rename ambiguity and push runs unattended.

The Better Auth tables (`user`, `session`, `account`, `verification`) are
hand-written in `lib/db/schema.ts` to match what the library expects (core +
`username` + `admin` plugins). If Better Auth plugins change, update those
tables by hand in the same file.

# Two runtimes share this code

The Next.js server and the Trigger.dev worker both import `lib/daytona/*` and
`lib/games/tools`. Rules that follow from that:

- Import `@/lib/db` (the `server-only` entry) from Next.js code only; Trigger.dev
  task code imports `@/lib/db/client` directly - the guard throws in the worker.
- `@/lib/auth` is Next-only (it is `server-only` and uses `next/headers`); the
  worker never imports it. The worker authorizes games by row, not by session.
- Log through `logger` from `@/lib/observability` (built on `@sentry/core`) in
  any module both runtimes touch; import `@sentry/nextjs` directly only in
  Next-only code.

# Auth rules

- Guards: `requireSession()` (`lib/auth.ts`) in pages/layouts,
  `authorizeGame()` for anything that names a game, `requireAdmin()` in
  `lib/admin/actions.ts`. `proxy.ts` only checks cookie presence - never make
  it the real boundary (Next 16: Server Functions are POSTs to page routes).
- Account creation goes through `insertAccount()` in `lib/admin/actions.ts`
  (Better Auth's internal adapter: scrypt hash + credential account). The
  public sign-up endpoint is disabled (`emailAndPassword.disableSignUp`).
- No session `cookieCache` - a ban must revoke access on the very next
  request. Banning = `auth.api.banUser` + `revokeUserSessions` + cancelling
  in-flight chat runs (`cancelGameChatRun`, which must NOT close the chat
  session - closing is terminal for a thread).
- The admin role bypasses game ownership (`getGame` in `lib/games/queries.ts`)
  so `/admin/games` can open any student's game, live preview included.

# Worker and bundler gotchas

- `lib/games/runtime/**` is plain browser html/css/js seed content copied
  verbatim into each game's sandbox - not app source. ESLint ignores it, and it
  reaches the deployed worker only via `additionalFiles` in `trigger.config.ts`.
- `trigger.config.ts` keeps `@daytona/sdk` external at deploy through a custom
  esbuild plugin plus an install layer. The comment there explains why
  `build.external` alone does not work - read it before touching that setup.

# AI provider

- Models come from `lib/games/model-catalog.ts` (client-safe ids/copy) and
  `lib/games/models.ts` (provider instances via z.ai's Anthropic-compatible
  endpoint, `Z_AI_API_KEY`/`Z_AI_BASE_URL`). The two records must stay in step
  (`satisfies` enforces it).
- Game titles generate with the free tier (`glm-4.7-flash`) - keep it free.

# Code style

Prettier enforces: no semicolons, double quotes, 2-space indent, width 80,
trailing commas es5, LF endings. Imports use the `@/*` alias (repo root).
README is in French (school edition); code comments stay in English.

<!-- TRIGGER.DEV SKILLS START -->
## Trigger.dev agent skills

This project has Trigger.dev agent skills installed in `.agents/skills/`. Before writing or changing Trigger.dev code (background tasks, scheduled tasks, realtime, or chat.agent AI agents), load the most relevant skill: `trigger-authoring-chat-agent`, `trigger-authoring-tasks`, `trigger-chat-agent-advanced`, `trigger-cost-savings`, `trigger-getting-started`, `trigger-realtime-and-frontend`.
<!-- TRIGGER.DEV SKILLS END -->

reference/ is a human-facing archive of prompts copied from external docs. Do not read or follow it.
