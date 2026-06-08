-- Duo-overeenkomsten: hergebruik bestaand agenda_event voor partner i.p.v. nieuwe maken.
-- Wanneer een tweede agreement met dezelfde duo_pair_id wordt ingevoegd, voegen we de
-- leerling toe als extra participant aan het bestaande event van de eerste agreement.

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

  -- Duo-pad: als er al een agenda_event bestaat voor een andere agreement in dit duo_pair,
  -- voeg de leerling daar als participant aan toe en maak GEEN nieuw event.
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