import "server-only"

import { desc, eq, sql } from "drizzle-orm"

import { db, games, user } from "@/lib/db"

/**
 * Whether the /install bootstrap still has something to do.
 *
 * True once any user holds the admin role - the page locks for good after the
 * first admin exists, so a returning visitor to /install is redirected rather
 * than offered a second shot at it.
 */
export async function adminExists(): Promise<boolean> {
  const [row] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.role, "admin"))
    .limit(1)

  return Boolean(row)
}

export type AdminUserRow = {
  id: string
  name: string
  username: string | null
  role: string
  banned: boolean | null
  banReason: string | null
  createdAt: Date
  gameCount: number
}

/**
 * Every account, with how many games it owns.
 *
 * Ordered by creation so the roster reads like the class list it is: the
 * accounts the admin made first sit on top.
 */
export async function listUsersWithGameCounts(): Promise<AdminUserRow[]> {
  const rows = await db
    .select({
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      banned: user.banned,
      banReason: user.banReason,
      createdAt: user.createdAt,
      gameCount: sql<number>`count(${games.id})::int`,
    })
    .from(user)
    .leftJoin(games, eq(games.userId, user.id))
    .groupBy(user.id)
    .orderBy(user.createdAt)

  return rows
}

export type AdminGameRow = {
  id: string
  title: string
  ownerName: string
  ownerUsername: string | null
  hasSandbox: boolean
  createdAt: Date
  updatedAt: Date
}

/**
 * Every game, whoever owns it, newest activity first.
 *
 * This is the admin's live view of the class: `updatedAt` moves on every turn
 * (the row is touched when the thread is persisted), so the top of this list
 * is what is being worked on right now.
 */
export async function listAllGamesWithOwners(): Promise<AdminGameRow[]> {
  return db
    .select({
      id: games.id,
      title: games.title,
      ownerName: user.name,
      ownerUsername: user.username,
      hasSandbox: sql<boolean>`(${games.sandboxId} is not null)`,
      createdAt: games.createdAt,
      updatedAt: games.updatedAt,
    })
    .from(games)
    .innerJoin(user, eq(games.userId, user.id))
    .orderBy(desc(games.updatedAt))
}

/**
 * Counts for the admin dashboard.
 */
export async function adminStats() {
  const [users] = await db
    .select({
      total: sql<number>`count(*)::int`,
      banned: sql<number>`count(*) filter (where ${user.banned})::int`,
    })
    .from(user)

  const [gameRows] = await db
    .select({
      total: sql<number>`count(*)::int`,
      withSandbox: sql<number>`count(*) filter (where ${games.sandboxId} is not null)::int`,
    })
    .from(games)

  return {
    users: users?.total ?? 0,
    banned: users?.banned ?? 0,
    games: gameRows?.total ?? 0,
    sandboxes: gameRows?.withSandbox ?? 0,
  }
}
