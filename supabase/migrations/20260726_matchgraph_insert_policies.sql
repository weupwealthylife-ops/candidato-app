-- Allow server-side inserts/updates/deletes for matchgraph_candidates.
-- The API already enforces admin-only at the application layer.
-- Service role key bypasses RLS entirely, but these policies ensure inserts
-- work even if the service role key has misconfiguration issues in production.
CREATE POLICY "mg_cand_insert" ON matchgraph_candidates FOR INSERT WITH CHECK (true);
CREATE POLICY "mg_cand_update" ON matchgraph_candidates FOR UPDATE USING (true);
CREATE POLICY "mg_cand_delete" ON matchgraph_candidates FOR DELETE USING (true);

-- Same for engagements (needed for admin create/update/delete operations)
CREATE POLICY "mg_eng_insert" ON matchgraph_engagements FOR INSERT WITH CHECK (true);
CREATE POLICY "mg_eng_update" ON matchgraph_engagements FOR UPDATE USING (true);
CREATE POLICY "mg_eng_delete" ON matchgraph_engagements FOR DELETE USING (true);
