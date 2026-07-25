import type { OptionModalFormState } from '@/pages/lesson-type-info/types';
import type { LessonFrequency } from '@/types/lesson-agreements';

export function updateOptionModalDuration(prev: OptionModalFormState, durationMinutes: string): OptionModalFormState {
	return { ...prev, duration_minutes: durationMinutes };
}

export function updateOptionModalFrequency(
	prev: OptionModalFormState,
	frequency: LessonFrequency,
): OptionModalFormState {
	return { ...prev, frequency };
}

export function updateOptionModalPriceUnder21(prev: OptionModalFormState, value: string): OptionModalFormState {
	return { ...prev, price_per_lesson_under_21: value };
}

export function updateOptionModalPriceAdult(prev: OptionModalFormState, value: string): OptionModalFormState {
	return { ...prev, price_per_lesson_adult: value };
}
