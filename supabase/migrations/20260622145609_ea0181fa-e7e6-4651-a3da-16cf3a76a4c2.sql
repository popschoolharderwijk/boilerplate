CREATE POLICY sepa_batches_objects_select ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'sepa-batches' AND (public.is_admin() OR public.is_site_admin()));

CREATE POLICY sepa_batches_objects_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'sepa-batches' AND (public.is_admin() OR public.is_site_admin()));

CREATE POLICY sepa_batches_objects_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'sepa-batches' AND (public.is_admin() OR public.is_site_admin()))
  WITH CHECK (bucket_id = 'sepa-batches' AND (public.is_admin() OR public.is_site_admin()));

CREATE POLICY sepa_batches_objects_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'sepa-batches' AND (public.is_admin() OR public.is_site_admin()));