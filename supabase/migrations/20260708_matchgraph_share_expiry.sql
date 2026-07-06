-- Add share token expiry to engagements
ALTER TABLE matchgraph_engagements
  ADD COLUMN IF NOT EXISTS share_token_expires_at timestamptz;
