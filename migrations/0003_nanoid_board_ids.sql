ALTER TABLE boards ADD COLUMN room_name TEXT;
CREATE UNIQUE INDEX boards_room_name ON boards(room_name) WHERE room_name IS NOT NULL;

CREATE TABLE board_id_migration (
  old_id TEXT PRIMARY KEY NOT NULL,
  new_id TEXT UNIQUE NOT NULL
);

-- Use six bits of independent random bytes for each of the 21 URL-safe characters.
WITH RECURSIVE board_ids(old_id, bytes, new_id) AS (
  SELECT id, lower(hex(randomblob(21))), ''
  FROM boards
  WHERE length(id) = 36
    AND substr(id, 9, 1) = '-' AND substr(id, 14, 1) = '-'
    AND substr(id, 19, 1) = '-' AND substr(id, 24, 1) = '-'
    AND length(replace(id, '-', '')) = 32
    AND lower(replace(id, '-', '')) NOT GLOB '*[^0-9a-f]*'
  UNION ALL
  SELECT old_id, substr(bytes, 3), new_id || substr(
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-',
    1 + ((instr('0123456789abcdef', substr(bytes, 1, 1)) - 1) & 3) * 16
      + instr('0123456789abcdef', substr(bytes, 2, 1)) - 1,
    1
  )
  FROM board_ids WHERE bytes <> ''
)
INSERT INTO board_id_migration(old_id, new_id)
SELECT old_id, new_id FROM board_ids WHERE bytes = '';

-- Insert the new parents first, so no cascading delete can remove child rows.
INSERT INTO boards(id, title, owner_id, created_at, updated_at, room_name)
SELECT ids.new_id, b.title, b.owner_id, b.created_at, b.updated_at, b.id
FROM board_id_migration ids JOIN boards b ON b.id = ids.old_id;

UPDATE board_members
SET board_id = (SELECT new_id FROM board_id_migration WHERE old_id = board_members.board_id)
WHERE board_id IN (SELECT old_id FROM board_id_migration);

UPDATE board_invites
SET board_id = (SELECT new_id FROM board_id_migration WHERE old_id = board_invites.board_id)
WHERE board_id IN (SELECT old_id FROM board_id_migration);

DELETE FROM boards WHERE id IN (SELECT old_id FROM board_id_migration);
DROP TABLE board_id_migration;
