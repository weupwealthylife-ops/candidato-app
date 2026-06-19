CREATE TABLE IF NOT EXISTS suggestions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  job_id       uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  match_score  int  NOT NULL DEFAULT 0,
  status       text NOT NULL DEFAULT 'pending', -- pending | accepted | dismissed
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE(candidate_id, job_id)
);

ALTER TABLE suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY allow_all_suggestions ON suggestions FOR ALL USING (true) WITH CHECK (true);
