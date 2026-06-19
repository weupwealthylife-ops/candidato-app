ALTER TABLE jobs ADD COLUMN IF NOT EXISTS required_experience text;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS push_sent_at timestamptz;
