
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS job_title text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS manager_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS must_change_password boolean NOT NULL DEFAULT false;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='profiles_status_check') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_status_check CHECK (status IN ('active','inactive','suspended'));
  END IF;
END $$;

-- Allow super_admin to update any profile
DROP POLICY IF EXISTS "profiles_super_admin_update" ON public.profiles;
CREATE POLICY "profiles_super_admin_update" ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Audit logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  performed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  target_user uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_logs_super_admin_select" ON public.audit_logs;
CREATE POLICY "audit_logs_super_admin_select" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS "audit_logs_insert_own" ON public.audit_logs;
CREATE POLICY "audit_logs_insert_own" ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = performed_by);

-- Ensure owner account is protected role
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'super_admin'::app_role FROM auth.users WHERE email = 'mohamedsabryabdelfatah@gmail.com'
ON CONFLICT DO NOTHING;
