CREATE TABLE IF NOT EXISTS matchgraph_engagements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  company_name text NOT NULL DEFAULT '',
  client_email text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  job_area text,
  city text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS matchgraph_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id uuid NOT NULL REFERENCES matchgraph_engagements(id) ON DELETE CASCADE,
  sort_order int NOT NULL DEFAULT 1,
  name text NOT NULL DEFAULT '',
  photo_url text,
  cv_url text,
  score_profession int NOT NULL DEFAULT 3,
  score_experience int NOT NULL DEFAULT 3,
  score_sector int NOT NULL DEFAULT 3,
  score_requirements int NOT NULL DEFAULT 3,
  score_availability int NOT NULL DEFAULT 3,
  is_top boolean NOT NULL DEFAULT false,
  formation text,
  relevant_experience text,
  technical_strengths text,
  qa_notes text,
  salary_expectation text,
  mobility text,
  interview_date text,
  client_notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE matchgraph_engagements ENABLE ROW LEVEL SECURITY;
ALTER TABLE matchgraph_candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mg_eng_read" ON matchgraph_engagements FOR SELECT USING (true);
CREATE POLICY "mg_cand_read" ON matchgraph_candidates FOR SELECT USING (true);

-- Storage bucket for photos and CVs
INSERT INTO storage.buckets (id, name, public) VALUES ('matchgraph-files', 'matchgraph-files', true)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "mg_files_read" ON storage.objects FOR SELECT USING (bucket_id = 'matchgraph-files');
CREATE POLICY "mg_files_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'matchgraph-files');
CREATE POLICY "mg_files_update" ON storage.objects FOR UPDATE USING (bucket_id = 'matchgraph-files');
