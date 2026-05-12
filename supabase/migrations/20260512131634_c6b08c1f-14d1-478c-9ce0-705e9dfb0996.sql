-- Leeftijdsspecifieke prijzen op lesopties (in centen om afrondingsfouten te voorkomen)
ALTER TABLE public.lesson_type_options
  ADD COLUMN IF NOT EXISTS price_per_lesson_under_21_cents integer,
  ADD COLUMN IF NOT EXISTS price_per_lesson_adult_cents integer;

-- Stripe Subscription Schedule koppeling
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS stripe_schedule_id text;

ALTER TABLE public.lesson_agreements
  ADD COLUMN IF NOT EXISTS stripe_schedule_id text;

-- Backfill standaardtarieven voor bestaande weekly/biweekly opties
UPDATE public.lesson_type_options
SET price_per_lesson_under_21_cents = 1950,
    price_per_lesson_adult_cents = 2360
WHERE frequency = 'weekly'
  AND price_per_lesson_under_21_cents IS NULL;

UPDATE public.lesson_type_options
SET price_per_lesson_under_21_cents = 2055,
    price_per_lesson_adult_cents = 2498
WHERE frequency = 'biweekly'
  AND price_per_lesson_under_21_cents IS NULL;