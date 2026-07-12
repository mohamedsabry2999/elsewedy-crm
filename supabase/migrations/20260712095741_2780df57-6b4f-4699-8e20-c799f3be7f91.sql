
ALTER TABLE public.pricing_requests
  ADD COLUMN IF NOT EXISTS pricing_notes text,
  ADD COLUMN IF NOT EXISTS priced_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS priced_at timestamptz,
  ADD COLUMN IF NOT EXISTS quotation_id uuid REFERENCES public.quotations(id) ON DELETE SET NULL;
