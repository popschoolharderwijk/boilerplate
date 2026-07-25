import { describe, expect, it } from 'bun:test';
import {
	updateOptionModalDuration,
	updateOptionModalFrequency,
	updateOptionModalPriceAdult,
	updateOptionModalPriceUnder21,
} from '../../../src/pages/lesson-type-info/optionModalFormHelpers';

const baseForm = {
	duration_minutes: '45',
	frequency: 'weekly' as const,
	price_per_lesson_under_21: '20',
	price_per_lesson_adult: '25',
};

describe('updateOptionModalDuration', () => {
	it('updates duration minutes', () => {
		expect(updateOptionModalDuration(baseForm, '60')).toEqual({ ...baseForm, duration_minutes: '60' });
	});
});

describe('updateOptionModalFrequency', () => {
	it('updates frequency', () => {
		expect(updateOptionModalFrequency(baseForm, 'biweekly')).toEqual({ ...baseForm, frequency: 'biweekly' });
	});
});

describe('updateOptionModalPriceUnder21', () => {
	it('updates under-21 price', () => {
		expect(updateOptionModalPriceUnder21(baseForm, '22')).toEqual({
			...baseForm,
			price_per_lesson_under_21: '22',
		});
	});
});

describe('updateOptionModalPriceAdult', () => {
	it('updates adult price', () => {
		expect(updateOptionModalPriceAdult(baseForm, '30')).toEqual({
			...baseForm,
			price_per_lesson_adult: '30',
		});
	});
});
