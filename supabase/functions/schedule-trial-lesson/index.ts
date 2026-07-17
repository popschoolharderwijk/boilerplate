// Schedule a trial lesson (admin/staff only).
// - Optionally based on a lesson_signup_requests row (then student data is taken from there).
// - Otherwise pass student first_name/last_name/email + lesson_type_id explicitly.
// - Creates auth user + profile + student row when no user exists for the email.
// - Inserts trial_lessons row, agenda_events row (source_type='trial_lesson') and participants.
// - Marks the related signup request as 'trial_scheduled' when applicable.

import { handleScheduleTrialLesson } from './handler.ts';

Deno.serve(handleScheduleTrialLesson);
