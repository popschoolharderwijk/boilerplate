import type { LessonTypeFormState } from '@/types/lesson-agreements';

export const emptyLessonTypeForm: LessonTypeFormState = {
	name: '',
	description: '',
	icon: '',
	color: '',
	cost_center: '',
	is_group_lesson: false,
	is_duo_lesson: false,
	is_active: true,
};

export const DURATION_OPTIONS = [30, 45, 60, 90, 120] as const;
export const DEFAULT_DURATION_MINUTES = DURATION_OPTIONS[0];

export const DUPLICATE_OPTION_MESSAGE = 'Deze combinatie van duur en frequentie bestaat al voor deze lessoort.';
