
ALTER TYPE public.agenda_event_source_type ADD VALUE IF NOT EXISTS 'lesson_group';

ALTER TABLE public.agenda_event_deviations
  ADD COLUMN IF NOT EXISTS cancelled_participant_ids UUID[];

COMMENT ON COLUMN public.agenda_event_deviations.cancelled_participant_ids IS
  'For lesson_group events: list of participant user_ids who cancelled this occurrence. NULL = no per-participant cancellation; whole-lesson cancellation handled via is_cancelled.';
