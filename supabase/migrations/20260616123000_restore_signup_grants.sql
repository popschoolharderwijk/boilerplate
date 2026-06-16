-- Grants for tables whose CREATE TABLE migrations are read-only and lack the full grant set.
-- Kept as a standalone migration because the original creation files cannot be edited.
GRANT INSERT ON public.lesson_signup_requests TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lesson_signup_requests TO authenticated;
GRANT ALL ON public.lesson_signup_requests TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lesson_types TO authenticated;
GRANT ALL ON public.lesson_types TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lesson_type_options TO authenticated;
GRANT ALL ON public.lesson_type_options TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lesson_groups TO authenticated;
GRANT ALL ON public.lesson_groups TO service_role;
