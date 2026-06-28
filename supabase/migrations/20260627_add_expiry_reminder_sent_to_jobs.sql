ALTER TABLE jobs ADD COLUMN IF NOT EXISTS expiry_reminder_sent boolean NOT NULL DEFAULT false;
