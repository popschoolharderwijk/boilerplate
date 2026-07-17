import { describe, expect, it } from 'bun:test';
import {
	buildNoLessonPeriodPayload,
	isNoLessonPeriodFormValid,
	resolveNoLessonPeriodDeleteOutcome,
	resolveNoLessonPeriodSaveErrorToast,
	resolveNoLessonPeriodSaveSuccessToast,
} from '../../../src/lib/settings/noLessonPeriodsManagerHelpers';

describe('resolveNoLessonPeriodDeleteOutcome', () => {
	it('returns success when rows were deleted', () => {
		expect(resolveNoLessonPeriodDeleteOutcome(null, [{ id: 'period-1' }])).toBe('success');
	});

	it('returns error when delete failed', () => {
		expect(resolveNoLessonPeriodDeleteOutcome(new Error('denied'), null)).toBe('error');
	});

	it('returns error when no rows were deleted', () => {
		expect(resolveNoLessonPeriodDeleteOutcome(null, [])).toBe('error');
	});
});

describe('isNoLessonPeriodFormValid', () => {
	it('accepts a valid period form', () => {
		expect(isNoLessonPeriodFormValid('Kerst', '2026-12-20', '2026-12-31')).toBe(true);
	});

	it('rejects an end date before the start date', () => {
		expect(isNoLessonPeriodFormValid('Kerst', '2026-12-31', '2026-12-20')).toBe(false);
	});

	it('rejects an empty name', () => {
		expect(isNoLessonPeriodFormValid('   ', '2026-12-20', '2026-12-31')).toBe(false);
	});
});

describe('buildNoLessonPeriodPayload', () => {
	it('trims name and omits empty description', () => {
		expect(
			buildNoLessonPeriodPayload({
				name: '  Kerst  ',
				start_date: '2026-12-20',
				end_date: '2026-12-31',
				description: '   ',
			}),
		).toEqual({
			name: 'Kerst',
			start_date: '2026-12-20',
			end_date: '2026-12-31',
			description: null,
		});
	});

	it('keeps a trimmed description', () => {
		expect(
			buildNoLessonPeriodPayload({
				name: 'Kerst',
				start_date: '2026-12-20',
				end_date: '2026-12-31',
				description: '  vakantie  ',
			}),
		).toEqual({
			name: 'Kerst',
			start_date: '2026-12-20',
			end_date: '2026-12-31',
			description: 'vakantie',
		});
	});
});

describe('resolveNoLessonPeriodSaveToast', () => {
	it('returns update messages for update mode', () => {
		expect(resolveNoLessonPeriodSaveErrorToast('update')).toBe('Fout bij bijwerken lesvrije periode');
		expect(resolveNoLessonPeriodSaveSuccessToast('update')).toBe('Lesvrije periode bijgewerkt');
	});

	it('returns create messages for create mode', () => {
		expect(resolveNoLessonPeriodSaveErrorToast('create')).toBe('Fout bij aanmaken lesvrije periode');
		expect(resolveNoLessonPeriodSaveSuccessToast('create')).toBe('Lesvrije periode aangemaakt');
	});
});
