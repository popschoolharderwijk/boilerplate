import { describe, expect, it } from 'bun:test';
import { buildScheduleTrialLessonDialogView } from '../../../src/lib/trial-lessons/scheduleTrialLessonDialogHelpers';

describe('buildScheduleTrialLessonDialogView', () => {
	it('builds dialog view state from form and slot maps', () => {
		const setSubmitting = () => undefined;
		const onOpenChange = () => undefined;
		const onScheduled = () => undefined;
		const view = buildScheduleTrialLessonDialogView({
			open: true,
			signupRequest: {
				id: 'request-1',
				email: 'anna@example.com',
				lesson_type_id: 'lesson-1',
				lesson_type_option_id: 'option-1',
				first_name: 'Anna',
				last_name: 'Leerling',
			},
			onOpenChange,
			onScheduled,
			form: {
				duration: 60,
				notes: 'Note',
				studentEmail: 'anna@example.com',
				studentFirstName: 'Anna',
				studentLastName: 'Leerling',
				selected: {
					date: '2026-09-07',
					day_of_week: 1,
					start_time: '14:00:00',
					end_time: '15:00:00',
					teacher_user_id: 'teacher-1',
				},
				setSubmitting,
				submitting: false,
			} as never,
			slotMaps: {
				teachers: new Map([
					['teacher-1', { userId: 'teacher-1', firstName: 'Piet', lastName: 'Docent', avatarUrl: null }],
				]),
				loading: false,
			} as never,
			slotsGroupedByDate: new Map(),
		});

		expect(view.teachers.size).toBe(1);
		expect(view.loading).toBe(false);
		expect(view.dialogDescription).toContain('Anna Leerling');
		expect(typeof view.handleSubmit).toBe('function');
	});
});
