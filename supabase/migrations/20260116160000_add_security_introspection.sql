-- Security introspection functions for CI testing
-- These allow the test suite to verify RLS configuration against the baseline

CREATE OR REPLACE FUNCTION public.check_rls_enabled(p_table_name TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT relrowsecurity
     FROM pg_class
     WHERE relname = p_table_name
     AND relnamespace = 'public'::regnamespace),
    false
  );
$$;

CREATE OR REPLACE FUNCTION public.policy_exists(p_table_name TEXT, p_policy_name TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = p_table_name
    AND policyname = p_policy_name
  );
$$;

CREATE OR REPLACE FUNCTION public.get_table_policies(p_table_name TEXT)
RETURNS TEXT[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    ARRAY_AGG(policyname ORDER BY policyname),
    ARRAY[]::TEXT[]
  )
  FROM pg_policies
  WHERE schemaname = 'public'
  AND tablename = p_table_name;
$$;

CREATE OR REPLACE FUNCTION public.function_exists(p_fn_name TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = p_fn_name
    AND pronamespace = 'public'::regnamespace
  );
$$;

-- Revoke public access - only service role should call these
REVOKE ALL ON FUNCTION public.check_rls_enabled(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.policy_exists(TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_table_policies(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.function_exists(TEXT) FROM PUBLIC;

-- Change owner to service role
ALTER FUNCTION public.check_rls_enabled(TEXT) OWNER TO service_role;
ALTER FUNCTION public.policy_exists(TEXT, TEXT) OWNER TO service_role;
ALTER FUNCTION public.get_table_policies(TEXT) OWNER TO service_role;
ALTER FUNCTION public.function_exists(TEXT) OWNER TO service_role;

-- Grant execute only to the service role
GRANT EXECUTE ON FUNCTION public.check_rls_enabled(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.policy_exists(TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_table_policies(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.function_exists(TEXT) TO service_role;