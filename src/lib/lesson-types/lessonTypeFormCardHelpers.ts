import type { LessonTypeFormState } from '@/types/lesson-agreements';

export function applyGroupLessonToggle(form: LessonTypeFormState, checked: boolean): LessonTypeFormState {
	return {
		...form,
		is_group_lesson: checked,
		is_duo_lesson: checked ? false : form.is_duo_lesson,
	};
}

export function applyDuoLessonToggle(form: LessonTypeFormState, checked: boolean): LessonTypeFormState {
	return {
		...form,
		is_duo_lesson: checked,
		is_group_lesson: checked ? false : form.is_group_lesson,
	};
}

export function updateLessonTypeFormName(form: LessonTypeFormState, name: string): LessonTypeFormState {
	return { ...form, name };
}

export function updateLessonTypeFormDescription(form: LessonTypeFormState, description: string): LessonTypeFormState {
	return { ...form, description };
}

export function updateLessonTypeFormIcon(form: LessonTypeFormState, icon: string): LessonTypeFormState {
	return { ...form, icon };
}

export function updateLessonTypeFormColor(form: LessonTypeFormState, color: string): LessonTypeFormState {
	return { ...form, color };
}

export function updateLessonTypeFormCostCenter(form: LessonTypeFormState, costCenter: string): LessonTypeFormState {
	return { ...form, cost_center: costCenter };
}

export function updateLessonTypeFormActive(form: LessonTypeFormState, isActive: boolean): LessonTypeFormState {
	return { ...form, is_active: isActive };
}

export function shouldDisableLessonTypeSubmit(canSubmit: boolean, submitting: boolean): boolean {
	return !canSubmit || submitting;
}
