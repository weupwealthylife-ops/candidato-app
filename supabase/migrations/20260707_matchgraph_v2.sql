-- Add client_feedback and pipeline_status to candidates
ALTER TABLE matchgraph_candidates
  ADD COLUMN IF NOT EXISTS client_feedback text,
  ADD COLUMN IF NOT EXISTS pipeline_status text NOT NULL DEFAULT 'sent';

-- Add share_token to engagements (unique, for public links)
ALTER TABLE matchgraph_engagements
  ADD COLUMN IF NOT EXISTS share_token text UNIQUE;

-- Activity log table
CREATE TABLE IF NOT EXISTS matchgraph_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id uuid NOT NULL REFERENCES matchgraph_engagements(id) ON DELETE CASCADE,
  candidate_id uuid REFERENCES matchgraph_candidates(id) ON DELETE SET NULL,
  actor_email text NOT NULL,
  action text NOT NULL,
  details text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE matchgraph_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mg_activity_read" ON matchgraph_activity FOR SELECT USING (true);
CREATE POLICY "mg_activity_insert" ON matchgraph_activity FOR INSERT WITH CHECK (true);
