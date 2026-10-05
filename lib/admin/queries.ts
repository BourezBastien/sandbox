import "server-only"

import { asc, desc, eq, isNotNull, isNull, sql } from "drizzle-orm"

import { db, auditLog, games, user } from "@/lib/db"

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

export const USERS_PAGE_SIZE = 20
export const GAMES_PAGE_SIZE = 20
export const AUDIT_PAGE_SIZE = 30

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
 * One page of the roster, with how many games each account owns.
 *
 * The count includes archived games on purpose: a teacher asking "what did
 * this student make" wants the whole record, not the live subset.
 */
export async function listUsersWithGameCounts({
  page = 1,
}: {
  page?: number
}): Promise<{ rows: AdminUserRow[]; total: number }> {
  const [rows, [count]] = await Promise.all([
    db
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
      .orderBy(asc(user.createdAt))
      .limit(USERS_PAGE_SIZE)
      .offset((page - 1) * USERS_PAGE_SIZE),
    db.select({ total: sql<number>`count(*)::int` }).from(user),
  ])

  return { rows, total: count?.total ?? 0 }
}

export type AdminGameSortKey = "updatedAt" | "createdAt" | "title" | "owner"

export type AdminGameStatus = "active" | "trash" | "all"

export type AdminGameRow = {
  id: string
  title: string
  ownerName: string
  ownerUsername: string | null
  hasSandbox: boolean
  deletedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

// The sortable columns, as SQL. Owner sorts by the live name when there is
// one and by the snapshot when the account is gone, so archived rows from
// removed students still find their place in the order.
function sortColumn(sort: AdminGameSortKey) {
  switch (sort) {
    case "createdAt":
      return games.createdAt
    case "title":
      return games.title
    case "owner":
      return sql`coalesce(${user.name}, ${games.ownerSnapshot})`
    default:
      return games.updatedAt
  }
}

/**
 * One page of every game, whoever owns it, with sorting, a status filter and
 * the owner's name resolved live or from the snapshot.
 *
 * `updatedAt` moves on every turn (the row is touched when the thread is
 * persisted), so sorting on it with the default filter reads as "what is
 * being worked on right now".
 */
export async function listAllGamesWithOwners({
  page = 1,
  sort = "updatedAt",
  dir = "desc",
  status = "active",
}: {
  page?: number
  sort?: AdminGameSortKey
  dir?: "asc" | "desc"
  status?: AdminGameStatus
}): Promise<{ rows: AdminGameRow[]; total: number }> {
  const statusCondition =
    status === "active"
      ? isNull(games.deletedAt)
      : status === "trash"
        ? isNotNull(games.deletedAt)
        : undefined

  const column = sortColumn(sort)
  const order = dir === "asc" ? asc(column) : desc(column)

  const [rows, [count]] = await Promise.all([
    db
      .select({
        id: games.id,
        title: games.title,
        ownerName: sql<string>`coalesce(${user.name}, ${games.ownerSnapshot})`,
        ownerUsername: user.username,
        hasSandbox: sql<boolean>`(${games.sandboxId} is not null)`,
        deletedAt: games.deletedAt,
        createdAt: games.createdAt,
        updatedAt: games.updatedAt,
      })
      .from(games)
      .leftJoin(user, eq(games.userId, user.id))
      .where(statusCondition)
      .orderBy(order)
      .limit(GAMES_PAGE_SIZE)
      .offset((page - 1) * GAMES_PAGE_SIZE),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(games)
      .where(statusCondition),
  ])

  return { rows, total: count?.total ?? 0 }
}

export type AdminAuditRow = {
  id: string
  createdAt: Date
  actorId: string | null
  actorLabel: string
  action: string
  targetType: string | null
  targetId: string | null
  detail: string | null
}

/**
 * One page of the activity journal, newest first.
 *
 * A plain indexed scan with nothing joined: this is the page an admin lands
 * on right after something happened, so it must not be the slow one.
 */
export async function listAuditLog({
  page = 1,
}: {
  page?: number
}): Promise<{ rows: AdminAuditRow[]; total: number }> {
  const [rows, [count]] = await Promise.all([
    db
      .select({
        id: auditLog.id,
        createdAt: auditLog.createdAt,
        actorId: auditLog.actorId,
        actorLabel: auditLog.actorLabel,
        action: auditLog.action,
        targetType: auditLog.targetType,
        targetId: auditLog.targetId,
        detail: auditLog.detail,
      })
      .from(auditLog)
      .orderBy(desc(auditLog.createdAt))
      .limit(AUDIT_PAGE_SIZE)
      .offset((page - 1) * AUDIT_PAGE_SIZE),
    db.select({ total: sql<number>`count(*)::int` }).from(auditLog),
  ])

  return { rows, total: count?.total ?? 0 }
}

/**
 * Counts for the admin dashboard.
 */
export async function adminStats() {
  const [usersRow] = await db
    .select({
      total: sql<number>`count(*)::int`,
      banned: sql<number>`count(*) filter (where ${user.banned})::int`,
    })
    .from(user)

  const [gameRows] = await db
    .select({
      total: sql<number>`count(*)::int`,
      trashed: sql<number>`count(*) filter (where ${games.deletedAt} is not null)::int`,
      withSandbox: sql<number>`count(*) filter (where ${games.sandboxId} is not null and ${games.deletedAt} is null)::int`,
    })
    .from(games)

  const [turnRows] = await db
    .select({ turns: sql<number>`count(*)::int` })
    .from(auditLog)
    .where(eq(auditLog.action, "game.turn"))

  return {
    users: usersRow?.total ?? 0,
    banned: usersRow?.banned ?? 0,
    games: (gameRows?.total ?? 0) - (gameRows?.trashed ?? 0),
    trashed: gameRows?.trashed ?? 0,
    sandboxes: gameRows?.withSandbox ?? 0,
    turns: turnRows?.turns ?? 0,
  }
}
