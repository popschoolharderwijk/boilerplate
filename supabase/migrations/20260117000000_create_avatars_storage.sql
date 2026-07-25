-- =============================================================================
-- STORAGE: AVATARS BUCKET + POLICIES
-- =============================================================================
-- File path format: {user_id}.{ext} (e.g., abc-def-123.png)
-- Using consistent filename allows overwriting previous avatar (no storage leak)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
	'avatars',
	'avatars',
	true,
	5242880,
	ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
	public = excluded.public,
	file_size_limit = excluded.file_size_limit,
	allowed_mime_types = excluded.allowed_mime_types;

-- Allow authenticated users to upload their own avatar
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND name LIKE public.current_user_id()::text || '.%'
);

-- Allow authenticated users to update (overwrite) their own avatar
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND name LIKE public.current_user_id()::text || '.%'
)
WITH CHECK (
  bucket_id = 'avatars'
  AND name LIKE public.current_user_id()::text || '.%'
);

-- Allow authenticated users to delete their own avatar
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND name LIKE public.current_user_id()::text || '.%'
);

-- No SELECT policy on public avatars: public object URLs work without listing
-- (Supabase lint 0025 public_bucket_allows_listing).
