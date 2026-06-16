-- One-off data fix uit productie. Sla over als de referentiële lesson_agreement
-- (of subscription) niet bestaat in deze omgeving, bijv. na een lokale reset.
INSERT INTO public.subscriptions (
  lesson_agreement_id,
  stripe_customer_id,
  stripe_subscription_id,
  stripe_price_id,
  stripe_schedule_id,
  status,
  current_period_start,
  current_period_end,
  default_payment_method_brand
)
SELECT
  '5ce491ed-7846-4685-9b1b-d0ce7a5cc5ff'::uuid,
  'cus_UVHThngvgEpVnx',
  NULL,
  '',
  'sub_sched_1TWJvq9z8iTY4J0uZsfEEReD',
  'scheduled',
  '2026-05-13T00:00:00+00:00'::timestamptz,
  '2026-06-01T00:00:00+00:00'::timestamptz,
  'sepa_debit'
WHERE EXISTS (
  SELECT 1 FROM public.lesson_agreements
  WHERE id = '5ce491ed-7846-4685-9b1b-d0ce7a5cc5ff'::uuid
)
AND NOT EXISTS (
  SELECT 1 FROM public.subscriptions
  WHERE stripe_schedule_id = 'sub_sched_1TWJvq9z8iTY4J0uZsfEEReD'
);
