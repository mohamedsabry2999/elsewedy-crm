
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';
CREATE INDEX IF NOT EXISTS idx_leads_tags ON public.leads USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_clients_tags ON public.clients USING GIN (tags);
