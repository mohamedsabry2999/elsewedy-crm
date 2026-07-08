
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role,
  kind text NOT NULL,
  title text NOT NULL,
  body text,
  link text,
  entity_type text,
  entity_id uuid,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT notif_target_check CHECK (user_id IS NOT NULL OR role IS NOT NULL)
);

CREATE INDEX notifications_user_idx ON public.notifications(user_id, created_at DESC);
CREATE INDEX notifications_role_idx ON public.notifications(role, created_at DESC);
CREATE INDEX notifications_unread_idx ON public.notifications(user_id) WHERE read_at IS NULL;

GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own or role notifications" ON public.notifications
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR (role IS NOT NULL AND public.has_role(auth.uid(), role))
  );

CREATE POLICY "users mark own notifications read" ON public.notifications
  FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    OR (role IS NOT NULL AND public.has_role(auth.uid(), role))
  )
  WITH CHECK (
    user_id = auth.uid()
    OR (role IS NOT NULL AND public.has_role(auth.uid(), role))
  );

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
