import { describe, expect, it } from 'bun:test';
import {
	buildAgreementBillingPreviewInput,
	formatAgreementCents,
	formatAgreementDate,
	resolveAgreementDayLabel,
	resolveAgreementEndDateLabel,
	resolveAgreementStatusLabel,
	resolveAgreementStatusVariant,
	shouldShowAgreementPreviewBlock,
} from '../../../src/lib/students/lessonAgreementDialogHelpers';
import type { LessonAgreementWithTeacher } from '../../../src/types/lesson-agreements';

const agreement: LessonAgreementWithTeacher = {
	id: 'agr-1',
	day_of_week: 1,
	start_time: '14:00:00',
	start_date: '2026-09-01',
	end_date: null,
	is_active: true,
	notes: null,
	duration_minutes: 45,
	frequency: 'weekly',
	price_per_lesson: 25,
	teacher: { first_name: 'Jan', last_name: 'Jansen', avatar_url: null },
	lesson_type: { id: 'lt-1', name: 'Piano', icon: 'piano', color: '#ff0000' },
};

describe('buildAgreementBillingPreviewInput', () => {
	it('returns null when required context is missing', () => {
		expect(buildAgreementBillingPreviewInput(null, 'student-1', 'lt-1', true)).toBeNull();
		expect(buildAgreementBillingPreviewInput(agreement, undefined, 'lt-1', true)).toBeNull();
		expect(buildAgreementBillingPreviewInput(agreement, 'student-1', undefined, true)).toBeNull();
		expect(buildAgreementBillingPreviewInput(agreement, 'student-1', 'lt-1', false)).toBeNull();
	});

	it('builds billing preview input for privileged users', () => {
		expect(buildAgreementBillingPreviewInput(agreement, 'student-1', 'lt-1', true)).toEqual({
			id: 'agr-1',
			student_user_id: 'student-1',
			lesson_type_id: 'lt-1',
			frequency: 'weekly',
			duration_minutes: 45,
			day_of_week: 1,
			start_date: '2026-09-01',
			end_date: null,
		});
	});
});

describe('formatAgreementDate', () => {
	it('formats dates in Dutch long form', () => {
		expect(formatAgreementDate('2026-09-01')).toBe('1 september 2026');
	});
});

describe('formatAgreementCents', () => {
	it('formats cents as Dutch euros', () => {
		expect(formatAgreementCents(1950)).toBe('€\u00a019,50');
	});
});

describe('resolveAgreementStatusVariant', () => {
	it('returns default for active agreements', () => {
		expect(resolveAgreementStatusVariant(true)).toBe('default');
	});

	it('returns secondary for inactive agreements', () => {
		expect(resolveAgreementStatusVariant(false)).toBe('secondary');
	});
});

describe('resolveAgreementStatusLabel', () => {
	it('returns Dutch status labels', () => {
		expect(resolveAgreementStatusLabel(true)).toBe('Actief');
		expect(resolveAgreementStatusLabel(false)).toBe('Inactief');
	});
});

describe('resolveAgreementDayLabel', () => {
	it('returns the configured day name', () => {
		expect(resolveAgreementDayLabel(1, ['Zo', 'Ma', 'Di'])).toBe('Ma');
	});

	it('falls back to a numbered day label', () => {
		expect(resolveAgreementDayLabel(9, ['Zo', 'Ma'])).toBe('Dag 9');
	});
});

describe('resolveAgreementEndDateLabel', () => {
	it('returns the formatted end date when present', () => {
		expect(resolveAgreementEndDateLabel('2026-12-31')).toBe('31 december 2026');
	});

	it('returns the no-end-date label when absent', () => {
		expect(resolveAgreementEndDateLabel(null)).toBe('Geen einddatum');
	});
});

describe('shouldShowAgreementPreviewBlock', () => {
	it('returns true when preview input exists', () => {
		const previewInput = buildAgreementBillingPreviewInput(agreement, 'student-1', 'lt-1', true);
		expect(shouldShowAgreementPreviewBlock(previewInput)).toBe(true);
	});

	it('returns false when preview input is null', () => {
		expect(shouldShowAgreementPreviewBlock(null)).toBe(false);
	});
});
