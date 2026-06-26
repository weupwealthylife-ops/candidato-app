ALTER TABLE jobs ADD COLUMN IF NOT EXISTS payment_pending boolean NOT NULL DEFAULT false;
