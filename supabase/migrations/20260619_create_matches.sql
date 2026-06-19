CREATE TABLE IF NOT EXISTS matches (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  job_id       uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  path         int  NOT NULL DEFAULT 1, -- 1 = candidate applied, 2 = proactive suggestion
  matched_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE(candidate_id, job_id)
);

ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY allow_all_matches ON matches FOR ALL USING (true) WITH CHECK (true);
