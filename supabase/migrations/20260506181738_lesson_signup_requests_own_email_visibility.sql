-- Allow authenticated users to see signup requests matching their own email,
-- so students can view their own pending/processed signups in their profile.
DROP POLICY IF EXISTS lesson_signup_requests_select_staff ON public.lesson_signup_requests;

CREATE POLICY lesson_signup_requests_select
ON public.lesson_signup_requests
FOR SELECT
TO authenticated
USING (
  is_privileged()
  OR lower(email) = lower((SELECT p.email FROM public.profiles p WHERE p.user_id = current_user_id()))
);