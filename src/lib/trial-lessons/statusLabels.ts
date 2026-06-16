import type { Enums } from '@/integrations/supabase/types';

type TrialLessonStatus = Enums<'trial_lesson_status'>;

const TRIAL_STATUS_LABEL_STAFF: Record<TrialLessonStatus, string> = {
	scheduled: 'Ingepland',
	completed: 'Gegeven',
	cancelled: 'Geannuleerd',
	student_confirmed: 'Wil doorgaan',
	student_declined: 'Stopt',
	converted: 'Omgezet',
};

const TRIAL_STATUS_LABEL_STUDENT: Record<TrialLessonStatus, string> = {
	scheduled: 'Ingepland',
	completed: 'Gegeven',
	cancelled: 'Geannuleerd',
	student_confirmed: 'Doorgegeven: ik wil doorgaan',
	student_declined: 'Doorgegeven: ik stop',
	converted: 'Overeenkomst gemaakt',
};

export function getTrialStatusLabel(status: TrialLessonStatus, audience: 'staff' | 'student'): string {
	const labels = audience === 'student' ? TRIAL_STATUS_LABEL_STUDENT : TRIAL_STATUS_LABEL_STAFF;
	return labels[status] ?? status;
}
