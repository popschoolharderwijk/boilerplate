import { describe, expect, it } from 'bun:test';
import {
	resolveNoLessonPeriodEditorDialogTitle,
	shouldShowNoLessonPeriodEndDateError,
} from '../../../src/lib/settings/noLessonPeriodEditorHelpers';

describe('resolveNoLessonPeriodEditorDialogTitle', () => {
	it('returns edit title when editing', () => {
		expect(resolveNoLessonPeriodEditorDialogTitle({ name: 'Kerst' })).toBe('Periode bewerken');
	});

	it('returns create title when not editing', () => {
		expect(resolveNoLessonPeriodEditorDialogTitle(null)).toBe('Nieuwe lesvrije periode');
	});
});

describe('shouldShowNoLessonPeriodEndDateError', () => {
	it('returns true when end date is before start date', () => {
		expect(shouldShowNoLessonPeriodEndDateError('2026-12-25', '2026-12-20')).toBe(true);
	});

	it('returns false when dates are valid', () => {
		expect(shouldShowNoLessonPeriodEndDateError('2026-12-20', '2026-12-25')).toBe(false);
	});

	it('returns false when dates are incomplete', () => {
		expect(shouldShowNoLessonPeriodEndDateError('', '2026-12-25')).toBe(false);
	});
});
