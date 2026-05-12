ALTER TABLE public.subscriptions
  ALTER COLUMN stripe_subscription_id DROP NOT NULL;

ALTER TABLE public.subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_stripe_subscription_id_key;

DROP INDEX IF EXISTS public.idx_subscriptions_active_per_agreement;

ALTER TABLE public.subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_status_check;

ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_status_check CHECK (status IN (
    'scheduled','trialing','active','past_due','canceled','unpaid','incomplete','incomplete_expired','paused'
  ));

CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id_unique
  ON public.subscriptions(stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_stripe_schedule_id_unique
  ON public.subscriptions(stripe_schedule_id)
  WHERE stripe_schedule_id IS NOT NULL;

CREATE UNIQUE INDEX idx_subscriptions_active_per_agreement
  ON public.subscriptions(lesson_agreement_id)
  WHERE status IN ('scheduled','trialing','active','past_due','unpaid','incomplete','paused');