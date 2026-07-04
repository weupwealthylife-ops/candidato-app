CREATE OR REPLACE FUNCTION increment_job_credits(company_id uuid, amount int)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE companies SET job_credits = COALESCE(job_credits, 0) + amount WHERE id = company_id;
$$;
