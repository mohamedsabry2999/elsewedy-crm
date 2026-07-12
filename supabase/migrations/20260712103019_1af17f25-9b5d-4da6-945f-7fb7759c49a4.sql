
-- Tighten permissive RLS policies flagged by linter. Scope write access to actual staff roles.

-- activities: staff-only read/write (system-generated audit log; any staff role acceptable)
DROP POLICY IF EXISTS activities_all_auth ON public.activities;
CREATE POLICY activities_select_staff ON public.activities FOR SELECT TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['super_admin','top_management','sales_manager','sales_person','marketing_manager','pricing_team','production','quality_control','finance','customer_service','viewer']::app_role[]));
CREATE POLICY activities_insert_staff ON public.activities FOR INSERT TO authenticated
  WITH CHECK (has_any_role(auth.uid(), ARRAY['super_admin','top_management','sales_manager','sales_person','marketing_manager','pricing_team','production','quality_control','finance','customer_service']::app_role[]));

-- approvals: management + finance
DROP POLICY IF EXISTS "auth all approvals" ON public.approvals;
CREATE POLICY approvals_rw ON public.approvals FOR ALL TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['super_admin','top_management','sales_manager','finance']::app_role[]))
  WITH CHECK (has_any_role(auth.uid(), ARRAY['super_admin','top_management','sales_manager','finance']::app_role[]));

-- automation_rules: super_admin only
DROP POLICY IF EXISTS automation_rules_all_auth ON public.automation_rules;
CREATE POLICY automation_rules_rw ON public.automation_rules FOR ALL TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['super_admin','top_management']::app_role[]))
  WITH CHECK (has_any_role(auth.uid(), ARRAY['super_admin','top_management']::app_role[]));

-- competitors: sales + marketing + management
DROP POLICY IF EXISTS "auth all competitors" ON public.competitors;
CREATE POLICY competitors_rw ON public.competitors FOR ALL TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['super_admin','top_management','sales_manager','sales_person','marketing_manager']::app_role[]))
  WITH CHECK (has_any_role(auth.uid(), ARRAY['super_admin','top_management','sales_manager','marketing_manager']::app_role[]));

-- knowledge_articles: staff read; managers write
DROP POLICY IF EXISTS "auth all knowledge" ON public.knowledge_articles;
CREATE POLICY knowledge_select_staff ON public.knowledge_articles FOR SELECT TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['super_admin','top_management','sales_manager','sales_person','marketing_manager','pricing_team','production','quality_control','finance','customer_service','viewer']::app_role[]));
CREATE POLICY knowledge_write_managers ON public.knowledge_articles FOR ALL TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['super_admin','top_management','sales_manager','marketing_manager']::app_role[]))
  WITH CHECK (has_any_role(auth.uid(), ARRAY['super_admin','top_management','sales_manager','marketing_manager']::app_role[]));

-- meeting_reports: sales + management
DROP POLICY IF EXISTS "auth all meeting_reports" ON public.meeting_reports;
CREATE POLICY meeting_reports_rw ON public.meeting_reports FOR ALL TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['super_admin','top_management','sales_manager','sales_person']::app_role[]))
  WITH CHECK (has_any_role(auth.uid(), ARRAY['super_admin','top_management','sales_manager','sales_person']::app_role[]));

-- portal_tokens: sales-owned links + admin
DROP POLICY IF EXISTS portal_tokens_all_auth ON public.portal_tokens;
CREATE POLICY portal_tokens_rw ON public.portal_tokens FOR ALL TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['super_admin','top_management','sales_manager','sales_person','customer_service']::app_role[]))
  WITH CHECK (has_any_role(auth.uid(), ARRAY['super_admin','top_management','sales_manager','sales_person','customer_service']::app_role[]));

-- quotation_items: sales + pricing + management
DROP POLICY IF EXISTS quotation_items_all_auth ON public.quotation_items;
CREATE POLICY quotation_items_select_staff ON public.quotation_items FOR SELECT TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['super_admin','top_management','sales_manager','sales_person','pricing_team','finance','production','customer_service','viewer']::app_role[]));
CREATE POLICY quotation_items_write ON public.quotation_items FOR ALL TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['super_admin','sales_manager','sales_person','pricing_team']::app_role[]))
  WITH CHECK (has_any_role(auth.uid(), ARRAY['super_admin','sales_manager','sales_person','pricing_team']::app_role[]));

-- samples: sales + production + QC
DROP POLICY IF EXISTS "auth all samples" ON public.samples;
CREATE POLICY samples_rw ON public.samples FOR ALL TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['super_admin','top_management','sales_manager','sales_person','production','quality_control','customer_service']::app_role[]))
  WITH CHECK (has_any_role(auth.uid(), ARRAY['super_admin','sales_manager','sales_person','production','quality_control','customer_service']::app_role[]));

-- notifications INSERT: allow authenticated staff to create notifications for themselves or role broadcasts
DROP POLICY IF EXISTS "authenticated can insert notifications" ON public.notifications;
CREATE POLICY notifications_insert_staff ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (has_any_role(auth.uid(), ARRAY['super_admin','top_management','sales_manager','sales_person','marketing_manager','pricing_team','production','quality_control','finance','customer_service']::app_role[]));
