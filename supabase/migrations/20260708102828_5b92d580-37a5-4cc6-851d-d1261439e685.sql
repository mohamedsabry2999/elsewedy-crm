
-- ========== ENUMS ==========
CREATE TYPE public.order_status AS ENUM ('new','in_production','quality_check','packaging','ready','shipped','delivered','cancelled','on_hold');
CREATE TYPE public.production_stage_status AS ENUM ('pending','in_progress','done','blocked','skipped');
CREATE TYPE public.complaint_type AS ENUM ('delay','color_mismatch','material','finishing','quantity_shortage','damage','other');
CREATE TYPE public.complaint_status AS ENUM ('open','investigating','resolved','escalated','closed');
CREATE TYPE public.complaint_severity AS ENUM ('low','medium','high','critical');
CREATE TYPE public.campaign_platform AS ENUM ('meta','google','linkedin','email','whatsapp','seo','exhibition','other');
CREATE TYPE public.campaign_status AS ENUM ('planned','active','paused','completed','cancelled');
CREATE TYPE public.automation_status AS ENUM ('active','paused','draft');

-- ========== QUOTATION ITEMS ==========
CREATE TABLE public.quotation_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id uuid NOT NULL REFERENCES public.quotations(id) ON DELETE CASCADE,
  description text NOT NULL,
  quantity numeric(14,2) NOT NULL DEFAULT 1,
  unit text,
  unit_price numeric(14,2) NOT NULL DEFAULT 0,
  discount_pct numeric(5,2) NOT NULL DEFAULT 0,
  total numeric(14,2) NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quotation_items TO authenticated;
GRANT ALL ON public.quotation_items TO service_role;
ALTER TABLE public.quotation_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quotation_items_all_auth" ON public.quotation_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ========== ORDERS ==========
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  quotation_id uuid REFERENCES public.quotations(id) ON DELETE SET NULL,
  deal_id uuid REFERENCES public.deals(id) ON DELETE SET NULL,
  title text NOT NULL,
  status public.order_status NOT NULL DEFAULT 'new',
  total_amount numeric(14,2) NOT NULL DEFAULT 0,
  paid_amount numeric(14,2) NOT NULL DEFAULT 0,
  delivery_date date,
  actual_delivery_date date,
  production_notes text,
  delivery_address text,
  owner_id uuid REFERENCES auth.users(id),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders_all_auth" ON public.orders FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ========== PRODUCTION STAGES ==========
CREATE TABLE public.production_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  stage_name text NOT NULL,
  stage_order integer NOT NULL DEFAULT 0,
  status public.production_stage_status NOT NULL DEFAULT 'pending',
  assigned_to uuid REFERENCES auth.users(id),
  started_at timestamptz,
  completed_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.production_stages TO authenticated;
GRANT ALL ON public.production_stages TO service_role;
ALTER TABLE public.production_stages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "production_stages_all_auth" ON public.production_stages FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER production_stages_updated_at BEFORE UPDATE ON public.production_stages FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ========== COMPLAINTS ==========
CREATE TABLE public.complaints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_number text UNIQUE,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  complaint_type public.complaint_type NOT NULL DEFAULT 'other',
  severity public.complaint_severity NOT NULL DEFAULT 'medium',
  status public.complaint_status NOT NULL DEFAULT 'open',
  subject text NOT NULL,
  description text,
  resolution text,
  assigned_to uuid REFERENCES auth.users(id),
  resolved_at timestamptz,
  escalated_at timestamptz,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.complaints TO authenticated;
GRANT ALL ON public.complaints TO service_role;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "complaints_all_auth" ON public.complaints FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER complaints_updated_at BEFORE UPDATE ON public.complaints FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ========== CAMPAIGNS ==========
CREATE TABLE public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  platform public.campaign_platform NOT NULL DEFAULT 'meta',
  status public.campaign_status NOT NULL DEFAULT 'planned',
  budget numeric(14,2) NOT NULL DEFAULT 0,
  spent numeric(14,2) NOT NULL DEFAULT 0,
  leads_generated integer NOT NULL DEFAULT 0,
  deals_closed integer NOT NULL DEFAULT 0,
  revenue numeric(14,2) NOT NULL DEFAULT 0,
  start_date date,
  end_date date,
  target_sector text,
  target_service text,
  notes text,
  owner_id uuid REFERENCES auth.users(id),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaigns TO authenticated;
GRANT ALL ON public.campaigns TO service_role;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "campaigns_all_auth" ON public.campaigns FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER campaigns_updated_at BEFORE UPDATE ON public.campaigns FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Link leads to campaigns
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS campaign_id uuid REFERENCES public.campaigns(id) ON DELETE SET NULL;

-- ========== AUTOMATION RULES ==========
CREATE TABLE public.automation_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  trigger_type text NOT NULL, -- e.g. lead_created, quotation_sent, no_followup_7d
  trigger_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  action_type text NOT NULL, -- create_task, send_email, notify, change_stage
  action_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  status public.automation_status NOT NULL DEFAULT 'draft',
  last_run_at timestamptz,
  run_count integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.automation_rules TO authenticated;
GRANT ALL ON public.automation_rules TO service_role;
ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "automation_rules_all_auth" ON public.automation_rules FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER automation_rules_updated_at BEFORE UPDATE ON public.automation_rules FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ========== AI ASSISTANT ==========
CREATE TABLE public.ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'محادثة جديدة',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_conversations TO authenticated;
GRANT ALL ON public.ai_conversations TO service_role;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_conversations_own" ON public.ai_conversations FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE TRIGGER ai_conversations_updated_at BEFORE UPDATE ON public.ai_conversations FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.ai_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  role text NOT NULL, -- user | assistant | system
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_messages TO authenticated;
GRANT ALL ON public.ai_messages TO service_role;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_messages_via_conv" ON public.ai_messages FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.ai_conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.ai_conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid()));

-- ========== CUSTOMER PORTAL TOKENS ==========
CREATE TABLE public.portal_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  expires_at timestamptz,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.portal_tokens TO authenticated;
GRANT ALL ON public.portal_tokens TO service_role;
ALTER TABLE public.portal_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "portal_tokens_all_auth" ON public.portal_tokens FOR ALL TO authenticated USING (true) WITH CHECK (true);
