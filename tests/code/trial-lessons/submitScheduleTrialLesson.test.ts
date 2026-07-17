import { beforeAll, beforeEach, describe, expect, it, mock } from 'bun:test';
import type { FormEvent } from 'react';
import type { FreeSlotForTeacher } from '../../../src/lib/agreementSlots';

const toastMessages: { type: 'error' | 'success'; message: string }[] = [];
let invokeResult: { data: unknown; error: { message: string } | null } = { data: null, error: null };
let invokeBody: unknown = null;
let onSuccessCalls = 0;

mock.module('sonner', () => ({
	toast: {
		error: (message: string) => {
			toastMessages.push({ type: 'error', message });
		},
		success: (message: string) => {
			toastMessages.push({ type: 'success', message });
		},
	},
}));

mock.module('../../../src/integrations/supabase/client', () => ({
	supabase: {
		functions: {
			invoke: (_fn: string, options?: { body?: unknown }) => {
				invokeBody = options?.body ?? null;
				return Promise.resolve(invokeResult);
			},
		},
	},
}));

const selectedSlot: FreeSlotForTeacher = {
	date: '2026-09-07',
	day_of_week: 1,
	start_time: '09:00:00',
	end_time: '09:30:00',
	teacher_user_id: 'teacher-1',
};

describe('createScheduleTrialLessonSubmitHandler', () => {
	let createScheduleTrialLessonSubmitHandler: typeof import('../../../src/lib/trial-lessons/submitScheduleTrialLesson').createScheduleTrialLessonSubmitHandler;

	beforeAll(async () => {
		({ createScheduleTrialLessonSubmitHandler } = await import(
			'../../../src/lib/trial-lessons/submitScheduleTrialLesson'
		));
	});

	beforeEach(() => {
		toastMessages.length = 0;
		invokeResult = { data: null, error: null };
		invokeBody = null;
		onSuccessCalls = 0;
	});

	it('shows error when no slot is selected', async () => {
		let submitting = false;
		const handler = createScheduleTrialLessonSubmitHandler(
			() => ({
				lessonTypeId: 'lt-1',
				duration: 30,
				notes: '',
				studentEmail: 'anna@example.com',
				studentFirstName: 'Anna',
				studentLastName: 'Bakker',
				hasSignupRequest: false,
				onSuccess: () => {
					onSuccessCalls += 1;
				},
			}),
			() => null,
			(value) => {
				submitting = value;
			},
		);

		await handler({ preventDefault: () => {} } as FormEvent);
		expect(toastMessages).toEqual([{ type: 'error', message: 'Selecteer een tijdslot' }]);
		expect(submitting).toBe(false);
		expect(onSuccessCalls).toBe(0);
	});

	it('invokes schedule-trial-lesson and calls onSuccess', async () => {
		let submitting = false;
		const handler = createScheduleTrialLessonSubmitHandler(
			() => ({
				signupRequestId: 'req-1',
				lessonTypeId: 'lt-1',
				lessonTypeOptionId: null,
				duration: 30,
				notes: 'Notitie',
				studentEmail: 'anna@example.com',
				studentFirstName: 'Anna',
				studentLastName: 'Bakker',
				hasSignupRequest: true,
				onSuccess: () => {
					onSuccessCalls += 1;
				},
			}),
			() => selectedSlot,
			(value) => {
				submitting = value;
			},
		);

		await handler({ preventDefault: () => {} } as FormEvent);
		expect(submitting).toBe(false);
		expect(onSuccessCalls).toBe(1);
		expect(toastMessages).toEqual([{ type: 'success', message: 'Proefles ingepland' }]);
		expect(invokeBody).toEqual({
			signup_request_id: 'req-1',
			teacher_user_id: 'teacher-1',
			lesson_type_id: 'lt-1',
			lesson_type_option_id: null,
			scheduled_date: '2026-09-07',
			scheduled_start_time: '09:00:00',
			duration_minutes: 30,
			notes: 'Notitie',
			student_email: undefined,
			student_first_name: undefined,
			student_last_name: undefined,
		});
	});

	it('shows error when invoke returns an error response', async () => {
		invokeResult = { data: { error: 'Slot bezet' }, error: null };
		const handler = createScheduleTrialLessonSubmitHandler(
			() => ({
				lessonTypeId: 'lt-1',
				duration: 30,
				notes: '',
				studentEmail: 'anna@example.com',
				studentFirstName: 'Anna',
				studentLastName: 'Bakker',
				hasSignupRequest: false,
				onSuccess: () => {
					onSuccessCalls += 1;
				},
			}),
			() => selectedSlot,
			() => {},
		);

		await handler({ preventDefault: () => {} } as FormEvent);
		expect(toastMessages).toEqual([{ type: 'error', message: 'Slot bezet' }]);
		expect(onSuccessCalls).toBe(0);
	});

	it('shows error when invoke fails', async () => {
		invokeResult = { data: null, error: { message: 'Network error' } };
		const handler = createScheduleTrialLessonSubmitHandler(
			() => ({
				lessonTypeId: 'lt-1',
				duration: 30,
				notes: '',
				studentEmail: 'anna@example.com',
				studentFirstName: 'Anna',
				studentLastName: 'Bakker',
				hasSignupRequest: false,
				onSuccess: () => {},
			}),
			() => selectedSlot,
			() => {},
		);

		await handler({ preventDefault: () => {} } as FormEvent);
		expect(toastMessages).toEqual([{ type: 'error', message: 'Network error' }]);
	});
});
