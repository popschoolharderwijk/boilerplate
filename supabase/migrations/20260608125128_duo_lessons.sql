-- Consolidated duo lessons: schema (is_duo_lesson, duo_pair_id) + agenda event reuse trigger.

-- ============================================================
-- Part 1: duo schema changes
-- ============================================================

-- Idempotent re-run of duo lessons migration (first run failed on profiles.id)

-- 1. Lesson types: duo flag (column may already exist)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema='public' AND table_name='lesson_types' AND column_name='is_duo_lesson') THEN
    ALTER TABLE public.lesson_types ADD COLUMN is_duo_lesson boolean NOT NULL DEFAULT false;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='lesson_types_group_duo_exclusive') THEN
    ALTER TABLE public.lesson_types
      ADD CONSTRAINT lesson_types_group_duo_exclusive
      CHECK (NOT (is_group_lesson AND is_duo_lesson));
  END IF;
END $$;

-- 2. Lesson agreements: duo pair link
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema='public' AND table_name='lesson_agreements' AND column_name='duo_pair_id') THEN
    ALTER TABLE public.lesson_agreements ADD COLUMN duo_pair_id uuid;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_lesson_agreements_duo_pair_id
  ON public.lesson_agreements (duo_pair_id)
  WHERE duo_pair_id IS NOT NULL;

-- 3. Validation trigger (may already exist from a partial run; replace with OR REPLACE)
CREATE OR REPLACE FUNCTION public.validate_duo_agreement()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_duo boolean;
  v_partner_count integer;
  v_partner record;
BEGIN
  SELECT is_duo_lesson INTO v_is_duo
  FROM public.lesson_types
  WHERE id = NEW.lesson_type_id;

  IF v_is_duo IS NULL THEN
    RAISE EXCEPTION 'Onbekend lestype: %', NEW.lesson_type_id;
  END IF;

  IF v_is_duo AND NEW.duo_pair_id IS NULL THEN
    RAISE EXCEPTION 'Duo-lestype vereist een duo_pair_id';
  END IF;

  IF NOT v_is_duo AND NEW.duo_pair_id IS NOT NULL THEN
    RAISE EXCEPTION 'Niet-duo lestype mag geen duo_pair_id hebben';
  END IF;

  IF NEW.duo_pair_id IS NOT NULL THEN
    SELECT COUNT(*) INTO v_partner_count
    FROM public.lesson_agreements
    WHERE duo_pair_id = NEW.duo_pair_id
      AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND is_active = true;

    IF NEW.is_active = true AND v_partner_count > 1 THEN
      RAISE EXCEPTION 'Duo-paar mag maximaal 2 actieve overeenkomsten bevatten';
    END IF;

    SELECT * INTO v_partner
    FROM public.lesson_agreements
    WHERE duo_pair_id = NEW.duo_pair_id
      AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND is_active = true
    LIMIT 1;

    IF v_partner.id IS NOT NULL THEN
      IF v_partner.teacher_user_id <> NEW.teacher_user_id
         OR v_partner.lesson_type_id <> NEW.lesson_type_id
         OR v_partner.day_of_week <> NEW.day_of_week
         OR v_partner.start_time <> NEW.start_time
         OR v_partner.duration_minutes <> NEW.duration_minutes
         OR v_partner.frequency <> NEW.frequency
         OR v_partner.start_date <> NEW.start_date THEN
        RAISE EXCEPTION 'Duo-partners moeten dezelfde docent, lestype, dag, tijd, duur, frequentie en startdatum hebben';
      END IF;

      IF v_partner.student_user_id = NEW.student_user_id THEN
        RAISE EXCEPTION 'Duo-partners moeten verschillende leerlingen zijn';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_duo_agreement ON public.lesson_agreements;
CREATE TRIGGER trg_validate_duo_agreement
BEFORE INSERT OR UPDATE ON public.lesson_agreements
FOR EACH ROW EXECUTE FUNCTION public.validate_duo_agreement();

-- 4. Helper RPC: get duo partner display name (privacy-safe).
-- profiles uses user_id (not id) as PK; use view_profiles_with_display_name for display_name.
CREATE OR REPLACE FUNCTION public.get_duo_partner_display_name(_agreement_id uuid)
RETURNS TABLE (partner_user_id uuid, display_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH me AS (
    SELECT duo_pair_id, student_user_id
    FROM public.lesson_agreements
    WHERE id = _agreement_id
  )
  SELECT vp.user_id AS partner_user_id, vp.display_name
  FROM public.lesson_agreements la
  JOIN me ON la.duo_pair_id = me.duo_pair_id
  JOIN public.view_profiles_with_display_name vp ON vp.user_id = la.student_user_id
  WHERE la.duo_pair_id IS NOT NULL
    AND la.student_user_id <> me.student_user_id
    AND la.is_active = true
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_duo_partner_display_name(uuid) TO authenticated;

-- ============================================================
-- Part 2: trigger to reuse agenda_event for duo partner
-- ============================================================
-- Duo agreements: reuse existing agenda_event for partner instead of creating a new one.
-- When a second agreement with the same duo_pair_id is inserted, we add the
-- student as an additional participant to the existing event of the first agreement.

CREATE OR REPLACE FUNCTION public.trigger_lesson_agreement_create_agenda_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_teacher_user_id UUID;
  v_title TEXT;
  v_end_time TIME;
  v_agenda_event_id UUID;
  v_partner_event_id UUID;
BEGIN
  v_teacher_user_id := NEW.teacher_user_id;

  IF v_teacher_user_id IS NULL THEN
    RAISE EXCEPTION 'Teacher not found for teacher_user_id %', NEW.teacher_user_id;
  END IF;

  -- Duo path: if an agenda_event already exists for another agreement in this duo_pair,
  -- add the student there as a participant and do NOT create a new event.
  IF NEW.duo_pair_id IS NOT NULL THEN
    SELECT ae.id INTO v_partner_event_id
    FROM public.agenda_events ae
    JOIN public.lesson_agreements la
      ON la.id = ae.source_id
     AND ae.source_type = 'lesson_agreement'::public.agenda_event_source_type
    WHERE la.duo_pair_id = NEW.duo_pair_id
      AND la.id <> NEW.id
    LIMIT 1;

    IF v_partner_event_id IS NOT NULL THEN
      INSERT INTO public.agenda_participants (event_id, user_id)
      VALUES (v_partner_event_id, NEW.student_user_id)
      ON CONFLICT DO NOTHING;
      RETURN NEW;
    END IF;
  END IF;

  SELECT COALESCE(lt.name, 'Lesson') INTO v_title
  FROM public.lesson_types lt
  WHERE lt.id = NEW.lesson_type_id;

  v_end_time := NEW.start_time + (NEW.duration_minutes || ' minutes')::interval;

  BEGIN
    INSERT INTO public.agenda_events (
      source_type, source_id, owner_user_id, title,
      start_date, start_time, end_date, end_time,
      is_all_day, recurring, recurring_frequency, recurring_end_date, created_by
    ) VALUES (
      'lesson_agreement'::public.agenda_event_source_type,
      NEW.id, v_teacher_user_id, v_title,
      NEW.start_date, NEW.start_time, NEW.end_date, v_end_time,
      false, true, NEW.frequency, NEW.end_date, v_teacher_user_id
    )
    RETURNING id INTO v_agenda_event_id;

    INSERT INTO public.agenda_participants (event_id, user_id)
    VALUES (v_agenda_event_id, v_teacher_user_id);

    INSERT INTO public.agenda_participants (event_id, user_id)
    VALUES (v_agenda_event_id, NEW.student_user_id);
  EXCEPTION
    WHEN unique_violation THEN
      RETURN NEW;
  END;

  RETURN NEW;
END;
$$;