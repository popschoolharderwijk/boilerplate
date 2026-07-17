import type { OptionModalFormState } from '@/pages/lesson-type-info/types';

export interface ParsedOptionModalValues {
	durationMinutes: number;
	priceUnder21: number;
	priceAdult: number;
}

export function getOptionModalValidationError(form: OptionModalFormState): string | null {
	const durationMinutes = parseInt(form.duration_minutes, 10);
	const priceUnder21 = parseFloat(form.price_per_lesson_under_21);
	const priceAdult = parseFloat(form.price_per_lesson_adult);

	if (Number.isNaN(durationMinutes) || durationMinutes <= 0) {
		return 'Duur moet een positief getal zijn';
	}
	if (Number.isNaN(priceUnder21) || priceUnder21 <= 0) {
		return 'Prijs <21 moet een positief getal zijn';
	}
	if (Number.isNaN(priceAdult) || priceAdult <= 0) {
		return 'Prijs 21+ moet een positief getal zijn';
	}

	return null;
}

export function parseOptionModalValues(form: OptionModalFormState): ParsedOptionModalValues {
	return {
		durationMinutes: parseInt(form.duration_minutes, 10),
		priceUnder21: parseFloat(form.price_per_lesson_under_21),
		priceAdult: parseFloat(form.price_per_lesson_adult),
	};
}

export function getOptionRowValidationError(
	option: { duration_minutes: string; price_per_lesson_under_21: string; price_per_lesson_adult: string },
	index: number,
): string | null {
	const durationMinutes = parseInt(option.duration_minutes, 10);
	const priceUnder21 = parseFloat(option.price_per_lesson_under_21);
	const priceAdult = parseFloat(option.price_per_lesson_adult);

	if (Number.isNaN(durationMinutes) || durationMinutes <= 0) {
		return `Optie ${index + 1}: duur moet een positief getal zijn`;
	}
	if (Number.isNaN(priceUnder21) || priceUnder21 <= 0) {
		return `Optie ${index + 1}: prijs <21 moet een positief getal zijn`;
	}
	if (Number.isNaN(priceAdult) || priceAdult <= 0) {
		return `Optie ${index + 1}: prijs 21+ moet een positief getal zijn`;
	}

	return null;
}
