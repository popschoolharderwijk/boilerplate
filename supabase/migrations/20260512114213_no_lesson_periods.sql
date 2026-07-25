CREATE TABLE public.no_lesson_periods (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	name TEXT NOT NULL,
	start_date DATE NOT NULL,
	end_date DATE NOT NULL,
	description TEXT,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	created_by UUID,
	updated_by UUID,
	CONSTRAINT no_lesson_periods_dates_check CHECK (end_date >= start_date)
);

CREATE INDEX idx_no_lesson_periods_dates ON public.no_lesson_periods (start_date, end_date);

CREATE OR REPLACE FUNCTION public.set_no_lesson_periods_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
	NEW.updated_at = now();
	RETURN NEW;
END;
$$;

CREATE TRIGGER trg_no_lesson_periods_updated_at
BEFORE UPDATE ON public.no_lesson_periods
FOR EACH ROW
EXECUTE FUNCTION public.set_no_lesson_periods_updated_at();

ALTER TABLE public.no_lesson_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.no_lesson_periods FORCE ROW LEVEL SECURITY;

CREATE POLICY no_lesson_periods_select_all
ON public.no_lesson_periods
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY no_lesson_periods_insert_admin
ON public.no_lesson_periods
FOR INSERT
TO authenticated
WITH CHECK (is_admin() OR is_site_admin());

CREATE POLICY no_lesson_periods_update_admin
ON public.no_lesson_periods
FOR UPDATE
TO authenticated
USING (is_admin() OR is_site_admin())
WITH CHECK (is_admin() OR is_site_admin());

CREATE POLICY no_lesson_periods_delete_admin
ON public.no_lesson_periods
FOR DELETE
TO authenticated
USING (is_admin() OR is_site_admin());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.no_lesson_periods TO authenticated;
REVOKE ALL ON TABLE public.no_lesson_periods FROM anon;

ALTER FUNCTION public.set_no_lesson_periods_updated_at() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.set_no_lesson_periods_updated_at() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_no_lesson_periods_updated_at() FROM anon;
REVOKE EXECUTE ON FUNCTION public.set_no_lesson_periods_updated_at() FROM authenticated;