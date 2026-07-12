
-- Helper
CREATE OR REPLACE FUNCTION public.has_any_role(_user_id uuid, _roles app_role[])
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = ANY(_roles));
$$;

-- ============ LEADS ============
DROP POLICY IF EXISTS leads_all_auth ON public.leads;
CREATE POLICY leads_select ON public.leads FOR SELECT TO authenticated USING (
  created_by = auth.uid()
  OR assigned_to = auth.uid()
  OR public.has_any_role(auth.uid(), ARRAY['super_admin','top_management','sales_manager','marketing_manager','viewer','finance','customer_service']::app_role[])
);
CREATE POLICY leads_insert ON public.leads FOR INSERT TO authenticated WITH CHECK (
  NOT public.has_role(auth.uid(),'viewer')
);
CREATE POLICY leads_update ON public.leads FOR UPDATE TO authenticated USING (
  (created_by = auth.uid() OR assigned_to = auth.uid())
  OR public.has_any_role(auth.uid(), ARRAY['super_admin','sales_manager','marketing_manager']::app_role[])
);
CREATE POLICY leads_delete ON public.leads FOR DELETE TO authenticated USING (
  public.has_any_role(auth.uid(), ARRAY['super_admin','sales_manager']::app_role[])
);

-- ============ CLIENTS ============
DROP POLICY IF EXISTS clients_all_auth ON public.clients;
CREATE POLICY clients_select ON public.clients FOR SELECT TO authenticated USING (
  created_by = auth.uid() OR assigned_to = auth.uid()
  OR public.has_any_role(auth.uid(), ARRAY['super_admin','top_management','sales_manager','marketing_manager','viewer','finance','customer_service','production','quality_control']::app_role[])
);
CREATE POLICY clients_insert ON public.clients FOR INSERT TO authenticated WITH CHECK (
  NOT public.has_any_role(auth.uid(), ARRAY['viewer','pricing_team','production','quality_control']::app_role[])
);
CREATE POLICY clients_update ON public.clients FOR UPDATE TO authenticated USING (
  (created_by = auth.uid() OR assigned_to = auth.uid())
  OR public.has_any_role(auth.uid(), ARRAY['super_admin','sales_manager','customer_service']::app_role[])
);
CREATE POLICY clients_delete ON public.clients FOR DELETE TO authenticated USING (
  public.has_any_role(auth.uid(), ARRAY['super_admin']::app_role[])
);

-- ============ DEALS ============
DROP POLICY IF EXISTS deals_all_auth ON public.deals;
CREATE POLICY deals_select ON public.deals FOR SELECT TO authenticated USING (
  created_by = auth.uid() OR owner_id = auth.uid()
  OR public.has_any_role(auth.uid(), ARRAY['super_admin','top_management','sales_manager','marketing_manager','viewer','finance']::app_role[])
);
CREATE POLICY deals_insert ON public.deals FOR INSERT TO authenticated WITH CHECK (
  NOT public.has_any_role(auth.uid(), ARRAY['viewer','pricing_team','production','quality_control','finance']::app_role[])
);
CREATE POLICY deals_update ON public.deals FOR UPDATE TO authenticated USING (
  (created_by = auth.uid() OR owner_id = auth.uid())
  OR public.has_any_role(auth.uid(), ARRAY['super_admin','sales_manager']::app_role[])
);
CREATE POLICY deals_delete ON public.deals FOR DELETE TO authenticated USING (
  public.has_any_role(auth.uid(), ARRAY['super_admin','sales_manager']::app_role[])
);

-- ============ QUOTATIONS ============
DROP POLICY IF EXISTS quotations_all_auth ON public.quotations;
CREATE POLICY quotations_select ON public.quotations FOR SELECT TO authenticated USING (
  created_by = auth.uid() OR owner_id = auth.uid()
  OR public.has_any_role(auth.uid(), ARRAY['super_admin','top_management','sales_manager','pricing_team','viewer','finance','production']::app_role[])
);
CREATE POLICY quotations_insert ON public.quotations FOR INSERT TO authenticated WITH CHECK (
  NOT public.has_any_role(auth.uid(), ARRAY['viewer','production','quality_control','customer_service']::app_role[])
);
CREATE POLICY quotations_update ON public.quotations FOR UPDATE TO authenticated USING (
  (created_by = auth.uid() OR owner_id = auth.uid())
  OR public.has_any_role(auth.uid(), ARRAY['super_admin','sales_manager','pricing_team']::app_role[])
);
CREATE POLICY quotations_delete ON public.quotations FOR DELETE TO authenticated USING (
  public.has_any_role(auth.uid(), ARRAY['super_admin','sales_manager']::app_role[])
);

-- ============ ORDERS ============
DROP POLICY IF EXISTS orders_all_auth ON public.orders;
CREATE POLICY orders_select ON public.orders FOR SELECT TO authenticated USING (
  created_by = auth.uid() OR owner_id = auth.uid()
  OR public.has_any_role(auth.uid(), ARRAY['super_admin','top_management','sales_manager','viewer','finance','production','quality_control','customer_service']::app_role[])
);
CREATE POLICY orders_insert ON public.orders FOR INSERT TO authenticated WITH CHECK (
  NOT public.has_any_role(auth.uid(), ARRAY['viewer','quality_control','customer_service','pricing_team']::app_role[])
);
CREATE POLICY orders_update ON public.orders FOR UPDATE TO authenticated USING (
  (created_by = auth.uid() OR owner_id = auth.uid())
  OR public.has_any_role(auth.uid(), ARRAY['super_admin','sales_manager','production','quality_control','finance']::app_role[])
);
CREATE POLICY orders_delete ON public.orders FOR DELETE TO authenticated USING (
  public.has_any_role(auth.uid(), ARRAY['super_admin']::app_role[])
);

-- ============ PRICING REQUESTS ============
DROP POLICY IF EXISTS "auth all pricing_requests" ON public.pricing_requests;
CREATE POLICY pricing_requests_select ON public.pricing_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY pricing_requests_write ON public.pricing_requests FOR INSERT TO authenticated WITH CHECK (
  NOT public.has_role(auth.uid(),'viewer')
);
CREATE POLICY pricing_requests_update ON public.pricing_requests FOR UPDATE TO authenticated USING (
  NOT public.has_role(auth.uid(),'viewer')
);
CREATE POLICY pricing_requests_delete ON public.pricing_requests FOR DELETE TO authenticated USING (
  public.has_any_role(auth.uid(), ARRAY['super_admin']::app_role[])
);

-- ============ PRODUCTION STAGES ============
DROP POLICY IF EXISTS production_stages_all_auth ON public.production_stages;
CREATE POLICY production_stages_select ON public.production_stages FOR SELECT TO authenticated USING (true);
CREATE POLICY production_stages_write ON public.production_stages FOR INSERT TO authenticated WITH CHECK (
  public.has_any_role(auth.uid(), ARRAY['super_admin','sales_manager','production']::app_role[])
);
CREATE POLICY production_stages_update ON public.production_stages FOR UPDATE TO authenticated USING (
  public.has_any_role(auth.uid(), ARRAY['super_admin','sales_manager','production','quality_control']::app_role[])
);
CREATE POLICY production_stages_delete ON public.production_stages FOR DELETE TO authenticated USING (
  public.has_role(auth.uid(),'super_admin')
);

-- ============ PAYMENTS ============
DROP POLICY IF EXISTS "auth all payments" ON public.payments;
CREATE POLICY payments_select ON public.payments FOR SELECT TO authenticated USING (
  public.has_any_role(auth.uid(), ARRAY['super_admin','top_management','sales_manager','finance','viewer']::app_role[])
);
CREATE POLICY payments_write ON public.payments FOR INSERT TO authenticated WITH CHECK (
  public.has_any_role(auth.uid(), ARRAY['super_admin','finance']::app_role[])
);
CREATE POLICY payments_update ON public.payments FOR UPDATE TO authenticated USING (
  public.has_any_role(auth.uid(), ARRAY['super_admin','finance']::app_role[])
);
CREATE POLICY payments_delete ON public.payments FOR DELETE TO authenticated USING (
  public.has_role(auth.uid(),'super_admin')
);

-- ============ COMPLAINTS ============
DROP POLICY IF EXISTS complaints_all_auth ON public.complaints;
CREATE POLICY complaints_select ON public.complaints FOR SELECT TO authenticated USING (true);
CREATE POLICY complaints_write ON public.complaints FOR INSERT TO authenticated WITH CHECK (
  NOT public.has_role(auth.uid(),'viewer')
);
CREATE POLICY complaints_update ON public.complaints FOR UPDATE TO authenticated USING (
  public.has_any_role(auth.uid(), ARRAY['super_admin','sales_manager','quality_control','customer_service']::app_role[])
);
CREATE POLICY complaints_delete ON public.complaints FOR DELETE TO authenticated USING (
  public.has_role(auth.uid(),'super_admin')
);

-- ============ DELIVERIES ============
DROP POLICY IF EXISTS "auth all deliveries" ON public.deliveries;
CREATE POLICY deliveries_select ON public.deliveries FOR SELECT TO authenticated USING (true);
CREATE POLICY deliveries_write ON public.deliveries FOR INSERT TO authenticated WITH CHECK (
  public.has_any_role(auth.uid(), ARRAY['super_admin','sales_manager','production','customer_service']::app_role[])
);
CREATE POLICY deliveries_update ON public.deliveries FOR UPDATE TO authenticated USING (
  public.has_any_role(auth.uid(), ARRAY['super_admin','sales_manager','production','customer_service']::app_role[])
);
CREATE POLICY deliveries_delete ON public.deliveries FOR DELETE TO authenticated USING (
  public.has_role(auth.uid(),'super_admin')
);

-- ============ TASKS ============
DROP POLICY IF EXISTS tasks_all_auth ON public.tasks;
CREATE POLICY tasks_select ON public.tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY tasks_write ON public.tasks FOR INSERT TO authenticated WITH CHECK (
  NOT public.has_role(auth.uid(),'viewer')
);
CREATE POLICY tasks_update ON public.tasks FOR UPDATE TO authenticated USING (
  NOT public.has_role(auth.uid(),'viewer')
);
CREATE POLICY tasks_delete ON public.tasks FOR DELETE TO authenticated USING (
  public.has_any_role(auth.uid(), ARRAY['super_admin','sales_manager']::app_role[])
);

-- ============ CAMPAIGNS ============
DROP POLICY IF EXISTS campaigns_all_auth ON public.campaigns;
CREATE POLICY campaigns_select ON public.campaigns FOR SELECT TO authenticated USING (true);
CREATE POLICY campaigns_write ON public.campaigns FOR INSERT TO authenticated WITH CHECK (
  public.has_any_role(auth.uid(), ARRAY['super_admin','marketing_manager']::app_role[])
);
CREATE POLICY campaigns_update ON public.campaigns FOR UPDATE TO authenticated USING (
  public.has_any_role(auth.uid(), ARRAY['super_admin','marketing_manager']::app_role[])
);
CREATE POLICY campaigns_delete ON public.campaigns FOR DELETE TO authenticated USING (
  public.has_any_role(auth.uid(), ARRAY['super_admin','marketing_manager']::app_role[])
);
