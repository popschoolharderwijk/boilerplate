import { getOptionRowValidationError } from '@/pages/lesson-type-info/validateLessonTypeOption';
import type { LessonTypeFormState, LessonTypeOptionFormRow } from '@/types/lesson-agreements';

export function getLessonTypeFormValidationError(
	form: LessonTypeFormState,
	optionsForm: LessonTypeOptionFormRow[],
): string | null {
	if (!form.name.trim()) {
		return 'Naam is verplicht';
	}
	if (!form.icon.trim()) {
		return 'Icoon is verplicht';
	}
	if (!form.color.trim()) {
		return 'Kleur is verplicht';
	}
	if (!/^#[0-9A-Fa-f]{6}$/.test(form.color.trim())) {
		return 'Kleur moet een hex code zijn (bijv. #FF5733)';
	}
	if (optionsForm.length === 0) {
		return 'Voeg minimaal één optie toe (duur, frequentie, prijs)';
	}

	for (let i = 0; i < optionsForm.length; i++) {
		const optionError = getOptionRowValidationError(optionsForm[i], i);
		if (optionError) return optionError;
	}

	return null;
}

export function buildLessonTypePayload(form: LessonTypeFormState) {
	return {
		name: form.name.trim(),
		description: form.description.trim() || null,
		icon: form.icon.trim(),
		color: form.color.trim(),
		cost_center: form.cost_center.trim() || null,
		is_group_lesson: form.is_group_lesson,
		is_duo_lesson: form.is_duo_lesson,
		is_active: form.is_active,
	};
}
