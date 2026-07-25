import { describe, expect, it } from 'bun:test';
import {
	getCancellationBannerClassName,
	getCancellationBannerMessage,
	shouldShowCancellationRescheduleButton,
} from '../../../src/components/agenda/agendaEventCancellationBannerHelpers';

describe('getCancellationBannerMessage', () => {
	it('returns teacher reschedule message', () => {
		expect(getCancellationBannerMessage('teacher', true)).toBe('Docent heeft afgezegd — inhalen vereist');
	});

	it('returns teacher completed message', () => {
		expect(getCancellationBannerMessage('teacher', false)).toBe('Docent heeft afgezegd — ingehaald');
	});

	it('returns student cancellation message', () => {
		expect(getCancellationBannerMessage('student')).toBe('Leerling heeft afgezegd');
	});
});

describe('getCancellationBannerClassName', () => {
	it('returns teacher banner classes', () => {
		expect(getCancellationBannerClassName('teacher')).toContain('orange');
	});

	it('returns student banner classes', () => {
		expect(getCancellationBannerClassName('student')).toContain('destructive');
	});
});

describe('shouldShowCancellationRescheduleButton', () => {
	it('returns true for teacher cancellations that need rescheduling', () => {
		expect(shouldShowCancellationRescheduleButton('teacher', true, () => undefined)).toBe(true);
	});

	it('returns false for student cancellations', () => {
		expect(shouldShowCancellationRescheduleButton('student', true, () => undefined)).toBe(false);
	});
});
