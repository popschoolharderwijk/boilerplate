ALTER TABLE public.lesson_signup_requests
  ADD COLUMN IF NOT EXISTS sepa_iban text NULL,
  ADD COLUMN IF NOT EXISTS sepa_account_holder text NULL,
  ADD COLUMN IF NOT EXISTS sepa_bic text NULL;