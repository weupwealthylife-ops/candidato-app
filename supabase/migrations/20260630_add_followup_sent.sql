ALTER TABLE candidates ADD COLUMN IF NOT EXISTS followup_sent boolean NOT NULL DEFAULT false;
