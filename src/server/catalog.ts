import { nanoid } from 'nanoid'
import type { WorkerEnv } from './env'

export type SharedRole = 'editor' | 'viewer'
export type BoardRole = 'owner' | SharedRole
type BoardRow = {
  id: string
  title: string
  role: BoardRole
  updatedAt: string
}

type BoardRecord = BoardRow & { roomName: string }

export function listBoards(db: D1Database, userId: string) {
  return db
    .prepare(
      `
    SELECT id, title, 'owner' AS role, updated_at AS updatedAt, COALESCE(room_name, id) AS roomName
      FROM boards WHERE owner_id = ?1
    UNION ALL
    SELECT b.id, b.title, m.role, b.updated_at, COALESCE(b.room_name, b.id)
      FROM board_members m JOIN boards b ON b.id = m.board_id
      WHERE m.user_id = ?1 AND b.owner_id <> ?1
    ORDER BY updatedAt DESC, id
  `,
    )
    .bind(userId)
    .all<BoardRecord>()
}

export async function getBoardWithRoom(
  db: D1Database,
  id: string,
  userId: string,
) {
  const record = await db
    .prepare(
      `
    SELECT b.id, b.title, b.updated_at AS updatedAt, COALESCE(b.room_name, b.id) AS roomName,
           CASE WHEN b.owner_id = ?2 THEN 'owner' ELSE m.role END AS role
      FROM boards b LEFT JOIN board_members m ON m.board_id = b.id AND m.user_id = ?2
      WHERE b.id = ?1 AND (b.owner_id = ?2 OR m.user_id IS NOT NULL)
  `,
    )
    .bind(id, userId)
    .first<BoardRecord>()
  if (!record) return null
  const { roomName, ...board } = record
  return { board, roomName }
}

export async function getBoard(db: D1Database, id: string, userId: string) {
  return (await getBoardWithRoom(db, id, userId))?.board ?? null
}

export async function createBoard(
  db: D1Database,
  ownerId: string,
  title: string,
): Promise<BoardRow> {
  const id = nanoid()
  const updatedAt = new Date().toISOString()
  await db
    .prepare(
      `
    INSERT INTO boards (id, title, owner_id, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?4)
  `,
    )
    .bind(id, title, ownerId, updatedAt)
    .run()
  return { id, title, updatedAt, role: 'owner' }
}

export function renameBoard(
  db: D1Database,
  boardId: string,
  userId: string,
  title: string,
) {
  return db
    .prepare(
      `
    UPDATE boards SET title = ?3, updated_at = ?4 WHERE id = ?1 AND owner_id = ?2
    RETURNING id, title, updated_at AS updatedAt, 'owner' AS role
  `,
    )
    .bind(boardId, userId, title, new Date().toISOString())
    .first<BoardRow>()
}

export async function deleteBoard(
  env: WorkerEnv,
  boardId: string,
  userId: string,
) {
  const deleted = await env.DB.prepare(
    'DELETE FROM boards WHERE id = ? AND owner_id = ? RETURNING COALESCE(room_name, id) AS roomName',
  )
    .bind(boardId, userId)
    .first<{ roomName: string }>()
  if (deleted) await env.BOARD_ROOMS.getByName(deleted.roomName).removeBoard()
}
