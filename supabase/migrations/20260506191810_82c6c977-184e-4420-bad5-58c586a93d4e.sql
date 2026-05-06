
-- Add stripe_price_id to lesson_agreements (phase 1: manual mapping)
ALTER TABLE public.lesson_agreements
  ADD COLUMN IF NOT EXISTS stripe_price_id text;

-- ============================================================
-- stripe_customers: 1 customer per user
-- ============================================================
CREATE TABLE public.stripe_customers (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id text NOT NULL UNIQUE
);

ALTER TABLE public.stripe_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_customers FORCE ROW LEVEL SECURITY;

CREATE POLICY "stripe_customers_select"
  ON public.stripe_customers FOR SELECT
  TO authenticated
  USING (user_id = public.current_user_id() OR public.is_privileged());

SELECT public.apply_audit_trail('public.stripe_customers'::regclass);

-- ============================================================
-- subscriptions: 1 row per Stripe subscription, linked to lesson_agreement
-- ============================================================
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_agreement_id uuid NOT NULL REFERENCES public.lesson_agreements(id) ON DELETE CASCADE,
  stripe_customer_id text NOT NULL,
  stripe_subscription_id text NOT NULL UNIQUE,
  stripe_price_id text NOT NULL,
  status text NOT NULL,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at timestamptz,
  canceled_at timestamptz,
  default_payment_method_brand text,
  latest_invoice_id text,
  CONSTRAINT subscriptions_status_check CHECK (status IN (
    'trialing','active','past_due','canceled','unpaid','incomplete','incomplete_expired','paused'
  ))
);

CREATE INDEX idx_subscriptions_lesson_agreement_id ON public.subscriptions(lesson_agreement_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE UNIQUE INDEX idx_subscriptions_active_per_agreement
  ON public.subscriptions(lesson_agreement_id)
  WHERE status IN ('trialing','active','past_due','unpaid','incomplete','paused');

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions FORCE ROW LEVEL SECURITY;

CREATE POLICY "subscriptions_select"
  ON public.subscriptions FOR SELECT
  TO authenticated
  USING (
    public.is_privileged()
    OR EXISTS (
      SELECT 1 FROM public.lesson_agreements la
      WHERE la.id = subscriptions.lesson_agreement_id
        AND (la.student_user_id = public.current_user_id()
             OR la.teacher_user_id = public.current_user_id())
    )
  );

SELECT public.apply_audit_trail('public.subscriptions'::regclass);

-- ============================================================
-- subscription_invoices: mirror of Stripe invoices
-- ============================================================
CREATE TABLE public.subscription_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  stripe_invoice_id text NOT NULL UNIQUE,
  amount_due integer NOT NULL,
  amount_paid integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'eur',
  status text NOT NULL,
  hosted_invoice_url text,
  invoice_pdf text,
  period_start timestamptz,
  period_end timestamptz,
  paid_at timestamptz
);

CREATE INDEX idx_subscription_invoices_subscription_id ON public.subscription_invoices(subscription_id);
CREATE INDEX idx_subscription_invoices_status ON public.subscription_invoices(status);

ALTER TABLE public.subscription_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_invoices FORCE ROW LEVEL SECURITY;

CREATE POLICY "subscription_invoices_select"
  ON public.subscription_invoices FOR SELECT
  TO authenticated
  USING (
    public.is_privileged()
    OR EXISTS (
      SELECT 1 FROM public.subscriptions s
      JOIN public.lesson_agreements la ON la.id = s.lesson_agreement_id
      WHERE s.id = subscription_invoices.subscription_id
        AND (la.student_user_id = public.current_user_id()
             OR la.teacher_user_id = public.current_user_id())
    )
  );

SELECT public.apply_audit_trail('public.subscription_invoices'::regclass);
