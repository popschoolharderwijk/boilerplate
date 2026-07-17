import { describe, expect, it } from 'bun:test';
import {
	buildScheduleTrialSignupRequestPayload,
	resolveSignupRequestsPageGate,
	resolveSignupStatusFilterVariant,
} from '../../../src/lib/signup-requests/signupRequestsPageShellHelpers';

const signupRow = {
	id: 'req-1',
	first_name: 'Anna',
	last_name: 'Bakker',
	email: 'anna@example.com',
	lesson_type_id: 'lt-1',
	lesson_type_option_id: 'opt-1',
	status: 'pending' as const,
	created_at: '2026-01-01T00:00:00Z',
	updated_at: '2026-01-01T00:00:00Z',
	processed_at: null,
	processed_by: null,
	lesson_group_id: null,
	notes: null,
	phone_number: null,
	date_of_birth: null,
	parent_name: null,
	parent_email: null,
	parent_phone_number: null,
	lesson_type_name: 'Piano',
	lesson_group_name: null,
	is_group_lesson: false,
	option_label: null,
	trial_scheduled_date: null,
	trial_scheduled_time: null,
	trial_teacher_name: null,
};

describe('resolveSignupRequestsPageGate', () => {
	it('returns loading while auth is loading', () => {
		expect(resolveSignupRequestsPageGate(true, true)).toBe('loading');
	});

	it('returns denied for non-privileged users', () => {
		expect(resolveSignupRequestsPageGate(false, false)).toBe('denied');
	});

	it('returns ready for privileged users', () => {
		expect(resolveSignupRequestsPageGate(false, true)).toBe('ready');
	});
});

describe('resolveSignupStatusFilterVariant', () => {
	it('returns default for active filter', () => {
		expect(resolveSignupStatusFilterVariant('pending', 'pending')).toBe('default');
	});

	it('returns outline for inactive filter', () => {
		expect(resolveSignupStatusFilterVariant('pending', 'all')).toBe('outline');
	});
});

describe('buildScheduleTrialSignupRequestPayload', () => {
	it('maps signup row to dialog payload', () => {
		expect(buildScheduleTrialSignupRequestPayload(signupRow as never)).toEqual({
			id: 'req-1',
			first_name: 'Anna',
			last_name: 'Bakker',
			email: 'anna@example.com',
			lesson_type_id: 'lt-1',
			lesson_type_option_id: 'opt-1',
		});
	});

	it('returns null when no row is selected', () => {
		expect(buildScheduleTrialSignupRequestPayload(null)).toBeNull();
	});
});
