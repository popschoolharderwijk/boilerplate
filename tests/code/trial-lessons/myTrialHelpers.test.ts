import { describe, expect, it } from 'bun:test';
import type { Enums } from '../../../src/integrations/supabase/types';
import {
	applyTrialDecisionToList,
	formatTrialScheduledTime,
	resolveLatestTrial,
	resolveMyTrialViewState,
	resolveTrialDecisionStatus,
	resolveTrialDecisionSuccessToast,
	shouldShowTrialConfirmedMessage,
	shouldShowTrialDecisionButtons,
} from '../../../src/lib/trial-lessons/myTrialHelpers';

type TrialLessonStatus = Enums<'trial_lesson_status'>;

const trial: { id: string; status: TrialLessonStatus; scheduled_date: string; scheduled_start_time: string } = {
	id: 'trial-1',
	status: 'scheduled',
	scheduled_date: '2026-09-07',
	scheduled_start_time: '14:00:00',
};

describe('resolveTrialDecisionStatus', () => {
	it('maps confirm to student_confirmed', () => {
		expect(resolveTrialDecisionStatus('confirm')).toBe('student_confirmed');
	});

	it('maps decline to student_declined', () => {
		expect(resolveTrialDecisionStatus('decline')).toBe('student_declined');
	});
});

describe('resolveTrialDecisionSuccessToast', () => {
	it('returns confirm message', () => {
		expect(resolveTrialDecisionSuccessToast('confirm')).toBe('Bedankt! We nemen contact op.');
	});

	it('returns decline message', () => {
		expect(resolveTrialDecisionSuccessToast('decline')).toBe('Bedankt voor je terugkoppeling.');
	});
});

describe('shouldShowTrialDecisionButtons', () => {
	it('returns true for scheduled trials', () => {
		expect(shouldShowTrialDecisionButtons('scheduled')).toBe(true);
	});

	it('returns true for completed trials', () => {
		expect(shouldShowTrialDecisionButtons('completed')).toBe(true);
	});

	it('returns false for confirmed trials', () => {
		expect(shouldShowTrialDecisionButtons('student_confirmed')).toBe(false);
	});
});

describe('shouldShowTrialConfirmedMessage', () => {
	it('returns true for student_confirmed status', () => {
		expect(shouldShowTrialConfirmedMessage('student_confirmed')).toBe(true);
	});

	it('returns false for scheduled status', () => {
		expect(shouldShowTrialConfirmedMessage('scheduled')).toBe(false);
	});
});

describe('applyTrialDecisionToList', () => {
	it('updates matching trial status', () => {
		expect(applyTrialDecisionToList([trial], 'trial-1', 'confirm').map((row) => row.status)).toEqual([
			'student_confirmed',
		]);
	});

	it('leaves other trials unchanged', () => {
		expect(applyTrialDecisionToList([trial], 'trial-2', 'decline')).toEqual([trial]);
	});
});

describe('resolveLatestTrial', () => {
	it('returns first trial in list', () => {
		expect(resolveLatestTrial([trial, { ...trial, id: 'trial-2' }])).toEqual(trial);
	});

	it('returns undefined for empty list', () => {
		expect(resolveLatestTrial([])).toBeUndefined();
	});
});

describe('formatTrialScheduledTime', () => {
	it('formats time to hours and minutes', () => {
		expect(formatTrialScheduledTime('14:00:00')).toBe('14:00');
	});
});

describe('resolveMyTrialViewState', () => {
	it('returns auth-loading while auth is loading', () => {
		expect(resolveMyTrialViewState(true, true, false, true)).toBe('auth-loading');
	});

	it('returns unauthenticated without user', () => {
		expect(resolveMyTrialViewState(false, false, false, false)).toBe('unauthenticated');
	});

	it('returns loading while trial data loads', () => {
		expect(resolveMyTrialViewState(false, true, true, false)).toBe('loading');
	});

	it('returns empty when no trial exists', () => {
		expect(resolveMyTrialViewState(false, true, false, false)).toBe('empty');
	});

	it('returns content when trial exists', () => {
		expect(resolveMyTrialViewState(false, true, false, true)).toBe('content');
	});
});
