-- scripts/004_add_deleted_at_column.sql
ALTER TABLE notes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
CREATE INDEX IF NOT EXISTS idx_notes_deleted_at ON notes(deleted_at);