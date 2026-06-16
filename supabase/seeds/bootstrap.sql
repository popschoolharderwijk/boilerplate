-- =============================================================================
-- BOOTSTRAP SEED (production-safe)
-- =============================================================================
-- Idempotent reference data for all environments. No auth.users.
-- Safe to run on production via: supabase db push --include-seed
-- =============================================================================
-- -----------------------------------------------------------------------------
-- LESSON TYPE NAMES (reference for search/replace)
-- -----------------------------------------------------------------------------
-- guitar       = 'Gitaarles'
-- drum         = 'Drumles'
-- vocal        = 'Zangles'
-- bass         = 'Basles'
-- keyboard     = 'Keyboardles'
-- saxophone    = 'Saxofoonles'
-- dj_beats     = 'DJ / Beats'
-- band_coaching = 'Bandcoaching'
-- -----------------------------------------------------------------------------

-- -----------------------------------------------------------------------------
-- LESSON TYPES (no duration/frequency/price; those live in lesson_type_options)
-- -----------------------------------------------------------------------------
-- Insert all 8 lesson types if they don't exist.
-- Bandcoaching is the only group lesson (is_group_lesson = true).
-- -----------------------------------------------------------------------------
INSERT INTO public.lesson_types (name, description, icon, color, cost_center, is_group_lesson, is_active)
SELECT * FROM (VALUES
  ('Gitaarles', NULL, 'LuGuitar', '#FF9500', NULL, false, true),
  ('Drumles', NULL, 'LuDrum', '#DC2626', NULL, false, true),
  ('Zangles', 'Learn to sing', 'LuMic', '#EC4899', NULL, false, true),
  ('Basles', NULL, 'GiGuitarBassHead', '#9333EA', NULL, false, true),
  ('Keyboardles', 'Keyboard lessons', 'LuPiano', '#3B82F6', NULL, false, true),
  ('Saxofoonles', NULL, 'GiSaxophone', '#FFB8A6', NULL, false, true),
  ('DJ / Beats', NULL, 'LuHeadphones', '#F59E0B', NULL, false, true),
  ('Bandcoaching', NULL, 'HiUserGroup', '#6366F1', NULL, true, true)
) AS v(name, description, icon, color, cost_center, is_group_lesson, is_active)
WHERE NOT EXISTS (SELECT 1 FROM public.lesson_types WHERE lesson_types.name = v.name);

-- -----------------------------------------------------------------------------
-- LESSON TYPE OPTIONS
-- Not all lesson types have all 15 options (30/45/60/90/120 x weekly/biweekly/monthly).
-- - Gitaarles, Drumles, Zangles, Basles, Keyboardles, Bandcoaching: all 15 options (price = duration).
-- - Saxofoonles: 6 options (30 and 45 min only) — agreements use 30 min weekly.
-- - DJ / Beats: 3 options (45 min only, all frequencies) — agreements use 45 min monthly.
-- -----------------------------------------------------------------------------

-- Full 15 options for: Gitaarles, Drumles, Zangles, Basles, Keyboardles, Bandcoaching
INSERT INTO public.lesson_type_options (lesson_type_id, duration_minutes, frequency, price_per_lesson)
SELECT lt.id, opt.duration_minutes, opt.frequency, opt.price_per_lesson
FROM public.lesson_types lt
CROSS JOIN (
  VALUES
    (30, 'weekly'::public.lesson_frequency, 30.00),
    (30, 'biweekly'::public.lesson_frequency, 30.00),
    (30, 'monthly'::public.lesson_frequency, 30.00),
    (45, 'weekly'::public.lesson_frequency, 45.00),
    (45, 'biweekly'::public.lesson_frequency, 45.00),
    (45, 'monthly'::public.lesson_frequency, 45.00),
    (60, 'weekly'::public.lesson_frequency, 60.00),
    (60, 'biweekly'::public.lesson_frequency, 60.00),
    (60, 'monthly'::public.lesson_frequency, 60.00),
    (90, 'weekly'::public.lesson_frequency, 90.00),
    (90, 'biweekly'::public.lesson_frequency, 90.00),
    (90, 'monthly'::public.lesson_frequency, 90.00),
    (120, 'weekly'::public.lesson_frequency, 120.00),
    (120, 'biweekly'::public.lesson_frequency, 120.00),
    (120, 'monthly'::public.lesson_frequency, 120.00)
) AS opt(duration_minutes, frequency, price_per_lesson)
WHERE lt.name IN ('Gitaarles', 'Drumles', 'Zangles', 'Basles', 'Keyboardles', 'Bandcoaching')
  AND NOT EXISTS (
    SELECT 1 FROM public.lesson_type_options lto
    WHERE lto.lesson_type_id = lt.id
      AND lto.duration_minutes = opt.duration_minutes
      AND lto.frequency = opt.frequency
      AND lto.price_per_lesson = opt.price_per_lesson
  );

-- Saxofoonles: only 30 and 45 min (6 options) — agreements use 30 min weekly
INSERT INTO public.lesson_type_options (lesson_type_id, duration_minutes, frequency, price_per_lesson)
SELECT lt.id, opt.duration_minutes, opt.frequency, opt.price_per_lesson
FROM public.lesson_types lt
CROSS JOIN (
  VALUES
    (30, 'weekly'::public.lesson_frequency, 30.00),
    (30, 'biweekly'::public.lesson_frequency, 30.00),
    (30, 'monthly'::public.lesson_frequency, 30.00),
    (45, 'weekly'::public.lesson_frequency, 45.00),
    (45, 'biweekly'::public.lesson_frequency, 45.00),
    (45, 'monthly'::public.lesson_frequency, 45.00)
) AS opt(duration_minutes, frequency, price_per_lesson)
WHERE lt.name = 'Saxofoonles'
  AND NOT EXISTS (
    SELECT 1 FROM public.lesson_type_options lto
    WHERE lto.lesson_type_id = lt.id
      AND lto.duration_minutes = opt.duration_minutes
      AND lto.frequency = opt.frequency
      AND lto.price_per_lesson = opt.price_per_lesson
  );

-- DJ / Beats: only 45 min, all 3 frequencies (3 options) — agreements use 45 min monthly
INSERT INTO public.lesson_type_options (lesson_type_id, duration_minutes, frequency, price_per_lesson)
SELECT lt.id, opt.duration_minutes, opt.frequency, opt.price_per_lesson
FROM public.lesson_types lt
CROSS JOIN (
  VALUES
    (45, 'weekly'::public.lesson_frequency, 45.00),
    (45, 'biweekly'::public.lesson_frequency, 45.00),
    (45, 'monthly'::public.lesson_frequency, 45.00)
) AS opt(duration_minutes, frequency, price_per_lesson)
WHERE lt.name = 'DJ / Beats'
  AND NOT EXISTS (
    SELECT 1 FROM public.lesson_type_options lto
    WHERE lto.lesson_type_id = lt.id
      AND lto.duration_minutes = opt.duration_minutes
      AND lto.frequency = opt.frequency
      AND lto.price_per_lesson = opt.price_per_lesson
  );

-- Standaardtarieven voor weekly/biweekly lesson_type_options (uit stripe_billing migratie).
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

-- Singleton boekhoudinstellingen (uit accounting_settings migratie).
INSERT INTO public.accounting_settings (id) VALUES (true) ON CONFLICT DO NOTHING;

-- Standaard e-mailtemplates (uit email_templates migratie).
INSERT INTO public.email_templates (event_key, subject, body_html, is_enabled) VALUES (
	'signup_received',
	'Bevestiging van je aanmelding bij Popschool Harderwijk',
	'<p>Hoi {{leerling_naam}},</p>
<p>Bedankt voor je aanmelding bij Popschool Harderwijk!</p>
<p>We hebben je aanvraag voor <strong>{{les_type}}</strong> ({{frequentie}}) ontvangen voor <strong>{{prijs_per_les}}</strong> per les.</p>
<p>We nemen zo snel mogelijk contact met je op om je inschrijving te verwerken.</p>
<p>Met muzikale groet,<br/>Popschool Harderwijk</p>',
	true
) ON CONFLICT (event_key) DO NOTHING;

INSERT INTO public.email_templates (event_key, subject, body_html, is_enabled) VALUES (
	'trial_scheduled',
	'Je proefles bij Popschool Harderwijk is ingepland',
	'<p>Hoi {{leerling_naam}},</p>
<p>Je proefles voor <strong>{{les_type}}</strong> is ingepland op <strong>{{datum}}</strong> om <strong>{{tijd}}</strong> ({{duur}} minuten).</p>
<p>Na de proefles kun je in de portal aangeven of je verder wilt met lessen. Pas dan stellen we een definitieve overeenkomst op.</p>
<p>Veel plezier en tot dan!<br/>Popschool Harderwijk</p>',
	true
) ON CONFLICT (event_key) DO NOTHING;

INSERT INTO public.email_templates (event_key, subject, body_html, is_enabled) VALUES (
	'trial_scheduled_teacher',
	'Nieuwe proefles ingepland: {{leerling_naam}}',
	'<p>Hoi {{docent_naam}},</p>
<p>Er is een proefles voor je ingepland.</p>
<ul>
  <li><strong>Leerling:</strong> {{leerling_naam}}</li>
  <li><strong>Lessoort:</strong> {{les_type}}</li>
  <li><strong>Datum:</strong> {{datum}}</li>
  <li><strong>Tijd:</strong> {{tijd}} ({{duur}} minuten)</li>
</ul>
<p>De afspraak staat in je agenda.</p>
<p>Groet,<br/>Popschool Harderwijk</p>',
	true
) ON CONFLICT (event_key) DO NOTHING;
