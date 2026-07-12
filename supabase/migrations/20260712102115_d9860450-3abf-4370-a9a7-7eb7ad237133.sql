
DO $$ BEGIN
  CREATE TYPE public.artwork_status AS ENUM ('uploaded','pending_review','approved','rejected','needs_revision','archived');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.artwork_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size BIGINT DEFAULT 0,
  storage_path TEXT NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  quotation_id UUID REFERENCES public.quotations(id) ON DELETE SET NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  job_ticket_id UUID,
  submitter_company TEXT,
  submitter_name TEXT,
  submitter_phone TEXT,
  submitter_email TEXT,
  submitter_reference TEXT,
  product_type TEXT,
  notes TEXT,
  is_reference BOOLEAN DEFAULT false,
  source TEXT NOT NULL DEFAULT 'internal',
  status public.artwork_status NOT NULL DEFAULT 'uploaded',
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  required_corrections TEXT,
  approved_for_production BOOLEAN DEFAULT false,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.artwork_files TO authenticated;
GRANT SELECT, INSERT ON public.artwork_files TO anon;
GRANT ALL ON public.artwork_files TO service_role;

ALTER TABLE public.artwork_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "artwork_select_internal" ON public.artwork_files FOR SELECT
TO authenticated
USING (
  public.has_any_role(auth.uid(), ARRAY['super_admin','top_management','sales_manager','marketing_manager','pricing_team','production','quality_control','customer_service','finance']::app_role[])
  OR uploaded_by = auth.uid()
  OR (
    public.has_role(auth.uid(), 'sales_person'::app_role)
    AND client_id IS NOT NULL
    AND EXISTS (SELECT 1 FROM public.clients c WHERE c.id = artwork_files.client_id AND (c.assigned_to = auth.uid() OR c.created_by = auth.uid()))
  )
);

CREATE POLICY "artwork_insert_any" ON public.artwork_files FOR INSERT
TO anon, authenticated WITH CHECK (true);

CREATE POLICY "artwork_update_reviewers" ON public.artwork_files FOR UPDATE
TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['super_admin','sales_manager','production','quality_control','customer_service']::app_role[]))
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','sales_manager','production','quality_control','customer_service']::app_role[]));

CREATE POLICY "artwork_delete_admins" ON public.artwork_files FOR DELETE
TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['super_admin','sales_manager']::app_role[]));

CREATE TRIGGER tg_artwork_updated_at BEFORE UPDATE ON public.artwork_files
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE INDEX IF NOT EXISTS idx_artwork_client ON public.artwork_files(client_id);
CREATE INDEX IF NOT EXISTS idx_artwork_quotation ON public.artwork_files(quotation_id);
CREATE INDEX IF NOT EXISTS idx_artwork_order ON public.artwork_files(order_id);
CREATE INDEX IF NOT EXISTS idx_artwork_status ON public.artwork_files(status);
