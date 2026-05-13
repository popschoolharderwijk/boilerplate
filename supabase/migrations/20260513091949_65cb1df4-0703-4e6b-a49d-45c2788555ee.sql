-- Add enum values for trial lessons (must be in separate transaction before use).
ALTER TYPE public.agenda_event_source_type ADD VALUE IF NOT EXISTS 'trial_lesson';
ALTER TYPE public.signup_request_status ADD VALUE IF NOT EXISTS 'trial_scheduled';