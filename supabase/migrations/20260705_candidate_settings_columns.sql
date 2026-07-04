ALTER TABLE candidates
  ADD COLUMN IF NOT EXISTS notify_updates boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS profile_visible boolean NOT NULL DEFAULT true;
