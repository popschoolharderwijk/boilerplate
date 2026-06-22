
DROP POLICY IF EXISTS "invoices_storage_admin_all" ON storage.objects;
DROP POLICY IF EXISTS "invoices_storage_student_select" ON storage.objects;

CREATE POLICY "invoices_storage_admin_all"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (bucket_id = 'invoices' AND (public.is_admin() OR public.is_site_admin()))
  WITH CHECK (bucket_id = 'invoices' AND (public.is_admin() OR public.is_site_admin()));

CREATE POLICY "invoices_storage_student_select"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'invoices'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
