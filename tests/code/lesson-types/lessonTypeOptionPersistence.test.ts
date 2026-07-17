import { describe, expect, it } from 'bun:test';
import {
	buildOptionFormRow,
	isDuplicateOption,
	isOptionDuplicateCandidate,
} from '../../../src/pages/lesson-type-info/lessonTypeOptionPersistence';
import type { OptionModalFormState, OptionRowWithKey } from '../../../src/pages/lesson-type-info/types';

const optionsForm: OptionRowWithKey[] = [
	{
		_newId: 'new-1',
		id: 'opt-1',
		duration_minutes: '45',
		frequency: 'weekly',
		price_per_lesson: '30.00',
		price_per_lesson_under_21: '25.00',
		price_per_lesson_adult: '30.00',
	},
];

const modalForm: OptionModalFormState = {
	duration_minutes: '45',
	frequency: 'weekly',
	price_per_lesson_under_21: '25.00',
	price_per_lesson_adult: '30.00',
};

describe('isOptionDuplicateCandidate', () => {
	it('returns true when duration and frequency match for new options', () => {
		expect(isOptionDuplicateCandidate(optionsForm[0], modalForm, optionsForm[0], false)).toBe(true);
	});

	it('returns false when editing the same existing option', () => {
		expect(isOptionDuplicateCandidate(optionsForm[0], modalForm, optionsForm[0], true)).toBe(false);
	});

	it('returns false when frequency differs', () => {
		expect(
			isOptionDuplicateCandidate(optionsForm[0], { ...modalForm, frequency: 'biweekly' }, optionsForm[0], false),
		).toBe(false);
	});
});

describe('isDuplicateOption', () => {
	it('returns true when another option matches duration and frequency', () => {
		expect(isDuplicateOption(optionsForm, modalForm, optionsForm[0], false)).toBe(true);
	});

	it('returns false when editing the same existing option', () => {
		expect(isDuplicateOption(optionsForm, modalForm, optionsForm[0], true)).toBe(false);
	});

	it('returns false when duration differs', () => {
		expect(isDuplicateOption(optionsForm, { ...modalForm, duration_minutes: '60' }, optionsForm[0], false)).toBe(
			false,
		);
	});
});

describe('buildOptionFormRow', () => {
	it('builds updated option row from modal form', () => {
		expect(buildOptionFormRow(optionsForm[0], modalForm, 30)).toEqual({
			_newId: 'new-1',
			id: 'opt-1',
			duration_minutes: '45',
			frequency: 'weekly',
			price_per_lesson: '30',
			price_per_lesson_under_21: '25.00',
			price_per_lesson_adult: '30.00',
		});
	});
});
