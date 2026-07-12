
CREATE POLICY "artwork_upload_any" ON storage.objects FOR INSERT TO anon, authenticated
WITH CHECK (bucket_id = 'artwork');

CREATE POLICY "artwork_read_internal" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'artwork');

CREATE POLICY "artwork_delete_admins" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'artwork' AND public.has_any_role(auth.uid(), ARRAY['super_admin','sales_manager']::app_role[]));
