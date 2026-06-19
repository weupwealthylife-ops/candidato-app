-- Maps experience string to a numeric rank for comparison
CREATE OR REPLACE FUNCTION exp_rank(e text) RETURNS int
LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE e
    WHEN 'Sin experiencia' THEN 0
    WHEN '1-2 años'        THEN 1
    WHEN '3-5 años'        THEN 2
    WHEN '6+ años'         THEN 3
    ELSE -1
  END
$$;

-- Scores a candidate against a job (0–100)
-- Weights: area 40, modality 20, city 15, experience 15, skills 10
CREATE OR REPLACE FUNCTION score_candidate_job(p_candidate_id uuid, p_job_id uuid)
RETURNS int
LANGUAGE plpgsql STABLE AS $$
DECLARE
  v_cand        candidates%ROWTYPE;
  v_job         jobs%ROWTYPE;
  v_score       int := 0;
  v_skill       text;
  v_match_count int := 0;
  v_total_skills int;
BEGIN
  SELECT * INTO v_cand FROM candidates WHERE id = p_candidate_id;
  SELECT * INTO v_job  FROM jobs       WHERE id = p_job_id;
  IF NOT FOUND THEN RETURN 0; END IF;

  -- Area (40 pts)
  IF v_cand.area IS NOT NULL AND v_job.area IS NOT NULL AND v_cand.area = v_job.area THEN
    v_score := v_score + 40;
  END IF;

  -- Modality (20 pts)
  IF v_cand.modality IS NOT NULL AND v_job.modality IS NOT NULL THEN
    IF v_cand.modality = v_job.modality THEN
      v_score := v_score + 20;
    ELSIF v_job.modality = 'Remoto' OR v_cand.modality = 'Remoto' THEN
      v_score := v_score + 12; -- remote is flexible
    ELSIF v_job.modality = 'Híbrido' OR v_cand.modality = 'Híbrido' THEN
      v_score := v_score + 8;
    END IF;
  END IF;

  -- City (15 pts) — waived if either side is remote
  IF v_job.modality = 'Remoto' OR v_cand.modality = 'Remoto' THEN
    v_score := v_score + 15;
  ELSIF v_cand.city IS NOT NULL AND v_job.city IS NOT NULL AND v_cand.city = v_job.city THEN
    v_score := v_score + 15;
  END IF;

  -- Experience (15 pts)
  IF v_job.required_experience IS NULL THEN
    v_score := v_score + 15;
  ELSIF v_cand.experience IS NOT NULL THEN
    IF exp_rank(v_cand.experience) >= exp_rank(v_job.required_experience) THEN
      v_score := v_score + 15;
    ELSIF exp_rank(v_cand.experience) = exp_rank(v_job.required_experience) - 1 THEN
      v_score := v_score + 8; -- one level below
    END IF;
  END IF;

  -- Skills overlap (10 pts) — no penalty if job has no required skills
  IF v_job.skills IS NULL OR array_length(v_job.skills, 1) IS NULL THEN
    v_score := v_score + 10;
  ELSIF v_cand.skills IS NOT NULL AND array_length(v_cand.skills, 1) > 0 THEN
    v_total_skills := array_length(v_job.skills, 1);
    FOREACH v_skill IN ARRAY v_job.skills LOOP
      IF v_skill = ANY(v_cand.skills) THEN
        v_match_count := v_match_count + 1;
      END IF;
    END LOOP;
    v_score := v_score + ROUND((v_match_count::float / v_total_skills::float) * 10);
  END IF;

  RETURN LEAST(v_score, 100);
END;
$$;

-- Returns strong-fit candidates for a job (score >= threshold, default 70)
CREATE OR REPLACE FUNCTION find_matches_for_job(p_job_id uuid, p_threshold int DEFAULT 70)
RETURNS TABLE(candidate_id uuid, match_score int)
LANGUAGE sql STABLE AS $$
  SELECT s.cid, s.sc
  FROM (
    SELECT c.id AS cid, score_candidate_job(c.id, p_job_id) AS sc
    FROM candidates c
    WHERE c.open_to_work = true
  ) s
  WHERE s.sc >= p_threshold
  ORDER BY s.sc DESC
$$;
