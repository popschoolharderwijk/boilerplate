
CREATE OR REPLACE FUNCTION public.mark_trial_lesson_completed(_trial_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_teacher_user_id uuid;
  v_status trial_lesson_status;
  v_caller uuid := auth.uid();
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT teacher_user_id, status
    INTO v_teacher_user_id, v_status
  FROM public.trial_lessons
  WHERE id = _trial_id;

  IF v_teacher_user_id IS NULL THEN
    RAISE EXCEPTION 'trial_lesson_not_found';
  END IF;

  IF NOT (public.is_privileged() OR v_teacher_user_id = v_caller) THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  IF v_status <> 'scheduled' THEN
    RAISE EXCEPTION 'invalid_status_transition' USING DETAIL = v_status::text;
  END IF;

  UPDATE public.trial_lessons
     SET status = 'completed',
         admin_processed_at = now(),
         admin_processed_by = v_caller,
         updated_by = v_caller,
         updated_at = now()
   WHERE id = _trial_id;
END;
$$;

REVOKE ALL ON FUNCTION public.mark_trial_lesson_completed(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_trial_lesson_completed(uuid) TO authenticated;
