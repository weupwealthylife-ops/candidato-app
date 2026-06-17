ALTER TABLE jobs ADD COLUMN IF NOT EXISTS views integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION increment_job_views(job_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE jobs SET views = views + 1 WHERE id = job_id;
END;
$$;
