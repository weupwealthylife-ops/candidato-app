-- Fix exp_rank to handle both en-dash (–) and hyphen (-) variants
-- that exist across the candidate profile and job posting forms.
-- Also maps the extended candidate-side options (5–10 años, 10+ años) → rank 3.
CREATE OR REPLACE FUNCTION exp_rank(e text) RETURNS int
LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE e
    WHEN 'Sin experiencia'  THEN 0
    WHEN '1-2 años'         THEN 1
    WHEN '1–2 años'         THEN 1
    WHEN '3-5 años'         THEN 2
    WHEN '3–5 años'         THEN 2
    WHEN '5-10 años'        THEN 3
    WHEN '5–10 años'        THEN 3
    WHEN '6+ años'          THEN 3
    WHEN '10+ años'         THEN 3
    ELSE -1
  END
$$;

-- Also fix find_matches_for_job to use explicit column names matching the RETURNS TABLE declaration
CREATE OR REPLACE FUNCTION find_matches_for_job(p_job_id uuid, p_threshold int DEFAULT 70)
RETURNS TABLE(candidate_id uuid, match_score int)
LANGUAGE sql STABLE AS $$
  SELECT s.candidate_id, s.match_score
  FROM (
    SELECT c.id AS candidate_id, score_candidate_job(c.id, p_job_id) AS match_score
    FROM candidates c
    WHERE c.open_to_work = true
  ) s
  WHERE s.match_score >= p_threshold
  ORDER BY s.match_score DESC
$$;
