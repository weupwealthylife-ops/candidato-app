ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_candidate_job_unique;
ALTER TABLE applications ADD CONSTRAINT applications_candidate_job_unique UNIQUE (candidate_id, job_id);
