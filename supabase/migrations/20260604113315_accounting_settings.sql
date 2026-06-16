
-- ============================================================
-- Boekhouding: accounting_settings tabel
-- ============================================================
CREATE TABLE public.accounting_settings (
  id boolean PRIMARY KEY DEFAULT true,
  journal_code_memoriaal text NOT NULL DEFAULT '90',
  journal_code_bank text NOT NULL DEFAULT '20',
  account_debiteuren text NOT NULL DEFAULT '1300',
  account_omzet_under_21 text NOT NULL DEFAULT '8000',
  account_omzet_21_plus text NOT NULL DEFAULT '8010',
  account_btw_21 text NOT NULL DEFAULT '1500',
  account_bank_stripe text NOT NULL DEFAULT '1100',
  btw_code_21 text NOT NULL DEFAULT 'VH',
  btw_code_exempt text NOT NULL DEFAULT '0',
  currency text NOT NULL DEFAULT 'EUR',
  school_year_start_month integer NOT NULL DEFAULT 8,
  description_template text NOT NULL DEFAULT 'Lesgeld {periode} - {leerling}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),
  CONSTRAINT accounting_settings_singleton CHECK (id = true),
  CONSTRAINT accounting_settings_month_valid CHECK (school_year_start_month BETWEEN 1 AND 12)
);

-- Grants (admin/site_admin via RLS only)
GRANT SELECT ON public.accounting_settings TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.accounting_settings TO authenticated;
GRANT ALL ON public.accounting_settings TO service_role;

ALTER TABLE public.accounting_settings ENABLE ROW LEVEL SECURITY;

-- Single PERMISSIVE policy per command, consolidated
CREATE POLICY accounting_settings_select ON public.accounting_settings
  FOR SELECT TO authenticated
  USING (is_privileged());

CREATE POLICY accounting_settings_insert_admin ON public.accounting_settings
  FOR INSERT TO authenticated
  WITH CHECK (is_admin() OR is_site_admin());

CREATE POLICY accounting_settings_update_admin ON public.accounting_settings
  FOR UPDATE TO authenticated
  USING (is_admin() OR is_site_admin())
  WITH CHECK (is_admin() OR is_site_admin());

CREATE POLICY accounting_settings_delete_admin ON public.accounting_settings
  FOR DELETE TO authenticated
  USING (is_admin() OR is_site_admin());

-- Audit fields trigger
CREATE TRIGGER trg_audit_accounting_settings
  BEFORE INSERT OR UPDATE ON public.accounting_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_audit_fields();

-- (Singleton-rij wordt geseed in supabase/seed.sql)

-- ============================================================
-- get_accounting_report: per Stripe-factuur de journaalposten berekenen
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_accounting_report(
  p_start_date date,
  p_end_date date
)
RETURNS json
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public'
AS $$
DECLARE
  v_result json;
BEGIN
  IF public.current_user_id() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;
  IF NOT public.is_privileged() THEN
    RAISE EXCEPTION 'Permission denied' USING ERRCODE = '42501';
  END IF;

  WITH
  invoice_base AS (
    SELECT
      si.id AS invoice_id,
      si.stripe_invoice_id,
      si.status,
      si.amount_due,
      si.amount_paid,
      si.currency,
      si.period_start,
      si.paid_at,
      si.hosted_invoice_url,
      s.lesson_agreement_id,
      la.student_user_id,
      la.lesson_type_id,
      st.date_of_birth,
      lt.name AS lesson_type_name,
      lt.cost_center AS lesson_type_cost_center,
      lt.icon AS lesson_type_icon,
      lt.color AS lesson_type_color,
      sp.first_name AS student_first_name,
      sp.last_name AS student_last_name,
      sp.email AS student_email
    FROM public.subscription_invoices si
    JOIN public.subscriptions s ON s.id = si.subscription_id
    JOIN public.lesson_agreements la ON la.id = s.lesson_agreement_id
    LEFT JOIN public.students st ON st.user_id = la.student_user_id
    LEFT JOIN public.lesson_types lt ON lt.id = la.lesson_type_id
    LEFT JOIN public.profiles sp ON sp.user_id = la.student_user_id
    WHERE si.period_start::date >= p_start_date
      AND si.period_start::date <= p_end_date
  ),
  invoice_calc AS (
    SELECT
      ib.*,
      CASE
        WHEN ib.date_of_birth IS NULL THEN 'unknown'
        WHEN AGE(ib.period_start::date, ib.date_of_birth) >= INTERVAL '21 years' THEN '21_plus'
        ELSE 'under_21'
      END AS age_category,
      -- For under_21 or unknown: full amount is exempt (no VAT)
      -- For 21+: amount_due includes 21% VAT, split into excl + VAT
      CASE
        WHEN ib.date_of_birth IS NOT NULL
             AND AGE(ib.period_start::date, ib.date_of_birth) >= INTERVAL '21 years'
        THEN ROUND(ib.amount_due::numeric / 1.21)::int
        ELSE ib.amount_due
      END AS amount_excl_btw_cents,
      CASE
        WHEN ib.date_of_birth IS NOT NULL
             AND AGE(ib.period_start::date, ib.date_of_birth) >= INTERVAL '21 years'
        THEN ib.amount_due - ROUND(ib.amount_due::numeric / 1.21)::int
        ELSE 0
      END AS btw_amount_cents,
      COALESCE(NULLIF(ib.lesson_type_cost_center, ''), ib.lesson_type_name, 'Onbekend') AS cost_center
    FROM invoice_base ib
  ),
  invoices_json AS (
    SELECT json_agg(
      json_build_object(
        'invoice_id', ic.invoice_id,
        'stripe_invoice_id', ic.stripe_invoice_id,
        'status', ic.status,
        'amount_due_cents', ic.amount_due,
        'amount_paid_cents', ic.amount_paid,
        'amount_excl_btw_cents', ic.amount_excl_btw_cents,
        'btw_amount_cents', ic.btw_amount_cents,
        'currency', ic.currency,
        'period_start', ic.period_start,
        'paid_at', ic.paid_at,
        'hosted_invoice_url', ic.hosted_invoice_url,
        'age_category', ic.age_category,
        'cost_center', ic.cost_center,
        'lesson_type_id', ic.lesson_type_id,
        'lesson_type_name', ic.lesson_type_name,
        'lesson_type_icon', ic.lesson_type_icon,
        'lesson_type_color', ic.lesson_type_color,
        'student_user_id', ic.student_user_id,
        'student_name', COALESCE(NULLIF(TRIM(COALESCE(ic.student_first_name,'') || ' ' || COALESCE(ic.student_last_name,'')), ''), ic.student_email)
      )
      ORDER BY ic.period_start, ic.invoice_id
    ) AS data
    FROM invoice_calc ic
  ),
  summary AS (
    SELECT
      COUNT(*)::int AS invoice_count,
      COALESCE(SUM(CASE WHEN age_category IN ('under_21','unknown') THEN amount_excl_btw_cents ELSE 0 END), 0)::int AS total_omzet_under_21_cents,
      COALESCE(SUM(CASE WHEN age_category = '21_plus' THEN amount_excl_btw_cents ELSE 0 END), 0)::int AS total_omzet_21_plus_excl_cents,
      COALESCE(SUM(btw_amount_cents), 0)::int AS total_btw_cents,
      COALESCE(SUM(amount_due), 0)::int AS total_debiteuren_cents,
      COALESCE(SUM(CASE WHEN status = 'paid' THEN amount_paid ELSE 0 END), 0)::int AS total_paid_cents,
      COALESCE(SUM(CASE WHEN status <> 'paid' THEN amount_due ELSE 0 END), 0)::int AS total_open_cents
    FROM invoice_calc
  ),
  by_cost_center AS (
    SELECT json_agg(
      json_build_object(
        'cost_center', cc,
        'invoice_count', invoice_count,
        'omzet_under_21_cents', omzet_under_21_cents,
        'omzet_21_plus_excl_cents', omzet_21_plus_excl_cents,
        'btw_cents', btw_cents,
        'total_debiteuren_cents', total_debiteuren_cents
      )
      ORDER BY cc
    ) AS data
    FROM (
      SELECT
        cost_center AS cc,
        COUNT(*)::int AS invoice_count,
        COALESCE(SUM(CASE WHEN age_category IN ('under_21','unknown') THEN amount_excl_btw_cents ELSE 0 END), 0)::int AS omzet_under_21_cents,
        COALESCE(SUM(CASE WHEN age_category = '21_plus' THEN amount_excl_btw_cents ELSE 0 END), 0)::int AS omzet_21_plus_excl_cents,
        COALESCE(SUM(btw_amount_cents), 0)::int AS btw_cents,
        COALESCE(SUM(amount_due), 0)::int AS total_debiteuren_cents
      FROM invoice_calc
      GROUP BY cost_center
    ) sub
  )
  SELECT json_build_object(
    'period', json_build_object('start', p_start_date, 'end', p_end_date),
    'summary', (SELECT row_to_json(summary.*) FROM summary),
    'invoices', COALESCE((SELECT data FROM invoices_json), '[]'::json),
    'by_cost_center', COALESCE((SELECT data FROM by_cost_center), '[]'::json)
  )
  INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_accounting_report(date, date) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.get_accounting_report(date, date) FROM anon;
