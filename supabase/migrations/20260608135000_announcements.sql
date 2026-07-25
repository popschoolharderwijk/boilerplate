CREATE TABLE IF NOT EXISTS public.announcements (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
	body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 20000),
	audience text[] NOT NULL DEFAULT ARRAY['teachers', 'students']::text[],
	published_at timestamptz DEFAULT now(),
	is_active boolean NOT NULL DEFAULT true,
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now(),
	created_by uuid,
	updated_by uuid,
	CONSTRAINT announcements_audience_not_empty CHECK (COALESCE(array_length(audience, 1), 0) > 0),
	CONSTRAINT announcements_audience_allowed CHECK (audience <@ ARRAY['teachers', 'students']::text[])
);

GRANT SELECT ON public.announcements TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcements TO authenticated;
GRANT ALL ON public.announcements TO service_role;

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS announcements_read_published ON public.announcements;
CREATE POLICY announcements_read_published
ON public.announcements
AS PERMISSIVE
FOR SELECT
TO anon, authenticated
USING (is_active = true AND published_at IS NOT NULL AND published_at <= now());

DROP POLICY IF EXISTS announcements_manage_privileged ON public.announcements;
CREATE POLICY announcements_manage_privileged
ON public.announcements
AS PERMISSIVE
FOR ALL
TO authenticated
USING (public.is_privileged())
WITH CHECK (public.is_privileged());

DROP TRIGGER IF EXISTS trg_audit_announcements ON public.announcements;
CREATE TRIGGER trg_audit_announcements
BEFORE INSERT OR UPDATE ON public.announcements
FOR EACH ROW
EXECUTE FUNCTION public.set_audit_fields();

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
	'announcement-images',
	'announcement-images',
	true,
	5242880,
	ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
	public = excluded.public,
	file_size_limit = excluded.file_size_limit,
	allowed_mime_types = excluded.allowed_mime_types;

DROP POLICY IF EXISTS announcement_images_read_public ON storage.objects;
-- No SELECT policy on public announcement-images: public object URLs work without listing
-- (Supabase lint 0025 public_bucket_allows_listing).

DROP POLICY IF EXISTS announcement_images_insert_privileged ON storage.objects;
CREATE POLICY announcement_images_insert_privileged
ON storage.objects
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'announcement-images' AND public.is_privileged());

DROP POLICY IF EXISTS announcement_images_update_privileged ON storage.objects;
CREATE POLICY announcement_images_update_privileged
ON storage.objects
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (bucket_id = 'announcement-images' AND public.is_privileged())
WITH CHECK (bucket_id = 'announcement-images' AND public.is_privileged());

DROP POLICY IF EXISTS announcement_images_delete_privileged ON storage.objects;
CREATE POLICY announcement_images_delete_privileged
ON storage.objects
AS PERMISSIVE
FOR DELETE
TO authenticated
USING (bucket_id = 'announcement-images' AND public.is_privileged());
