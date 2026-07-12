
-- Pricing Requests
CREATE TABLE public.pricing_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number TEXT UNIQUE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES public.deals(id) ON DELETE SET NULL,
  sales_owner UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  pricing_owner UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  service_type TEXT,
  product_type TEXT,
  printing_type TEXT,
  size TEXT,
  quantity INTEGER,
  material TEXT,
  colors TEXT,
  finishing TEXT,
  delivery_date DATE,
  urgency TEXT DEFAULT 'normal',
  artwork_url TEXT,
  sample_required BOOLEAN DEFAULT false,
  technical_notes TEXT,
  internal_notes TEXT,
  final_price NUMERIC,
  currency TEXT DEFAULT 'EGP',
  status TEXT NOT NULL DEFAULT 'draft',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pricing_requests TO authenticated;
GRANT ALL ON public.pricing_requests TO service_role;
ALTER TABLE public.pricing_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth all pricing_requests" ON public.pricing_requests FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER pricing_requests_updated BEFORE UPDATE ON public.pricing_requests FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Deliveries
CREATE TABLE public.deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_number TEXT UNIQUE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  contact_name TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  method TEXT,
  scheduled_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  driver TEXT,
  proof_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.deliveries TO authenticated;
GRANT ALL ON public.deliveries TO service_role;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth all deliveries" ON public.deliveries FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER deliveries_updated BEFORE UPDATE ON public.deliveries FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Payments
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  quotation_id UUID REFERENCES public.quotations(id) ON DELETE SET NULL,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  paid_amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'EGP',
  method TEXT,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'unpaid',
  collection_owner UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth all payments" ON public.payments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER payments_updated BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Samples
CREATE TABLE public.samples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sample_number TEXT UNIQUE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES public.deals(id) ON DELETE SET NULL,
  product_type TEXT,
  service_type TEXT,
  description TEXT,
  requested_at DATE DEFAULT CURRENT_DATE,
  produced_at DATE,
  delivered_at DATE,
  status TEXT NOT NULL DEFAULT 'requested',
  client_feedback TEXT,
  converted_to_order BOOLEAN DEFAULT false,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.samples TO authenticated;
GRANT ALL ON public.samples TO service_role;
ALTER TABLE public.samples ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth all samples" ON public.samples FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER samples_updated BEFORE UPDATE ON public.samples FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Approvals
CREATE TABLE public.approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_type TEXT NOT NULL,
  related_table TEXT,
  related_id UUID,
  requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approver UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  decision_notes TEXT,
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.approvals TO authenticated;
GRANT ALL ON public.approvals TO service_role;
ALTER TABLE public.approvals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth all approvals" ON public.approvals FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER approvals_updated BEFORE UPDATE ON public.approvals FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Competitors
CREATE TABLE public.competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES public.deals(id) ON DELETE SET NULL,
  service TEXT,
  competitor_price NUMERIC,
  advantage TEXT,
  reason TEXT,
  outcome TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.competitors TO authenticated;
GRANT ALL ON public.competitors TO service_role;
ALTER TABLE public.competitors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth all competitors" ON public.competitors FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER competitors_updated BEFORE UPDATE ON public.competitors FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Meeting Reports
CREATE TABLE public.meeting_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  sales_owner UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  meeting_date DATE NOT NULL DEFAULT CURRENT_DATE,
  meeting_type TEXT,
  purpose TEXT,
  client_needs TEXT,
  discussed_services TEXT,
  competitors_mentioned TEXT,
  budget NUMERIC,
  probability INTEGER,
  next_action TEXT,
  next_followup DATE,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meeting_reports TO authenticated;
GRANT ALL ON public.meeting_reports TO service_role;
ALTER TABLE public.meeting_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth all meeting_reports" ON public.meeting_reports FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER meeting_reports_updated BEFORE UPDATE ON public.meeting_reports FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Knowledge Base
CREATE TABLE public.knowledge_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT,
  content TEXT,
  tags TEXT[],
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.knowledge_articles TO authenticated;
GRANT ALL ON public.knowledge_articles TO service_role;
ALTER TABLE public.knowledge_articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth all knowledge" ON public.knowledge_articles FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER knowledge_articles_updated BEFORE UPDATE ON public.knowledge_articles FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
