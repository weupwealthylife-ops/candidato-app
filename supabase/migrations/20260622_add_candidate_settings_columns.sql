-- Add persisted settings columns that the UI toggles reference
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS notify_updates boolean NOT NULL DEFAULT true;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS profile_visible boolean NOT NULL DEFAULT true;
