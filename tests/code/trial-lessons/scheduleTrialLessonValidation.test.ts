import { describe, expect, it } from 'bun:test';
import {
	computeEndTime,
	validateScheduleBody,
	validateStudentData,
} from '../../../supabase/functions/schedule-trial-lesson/validation';

const TEACHER_ID = '11111111-1111-1111-1111-111111111111';
const LESSON_TYPE_ID = '33333333-3333-3333-3333-333333333333';

async function readError(response: Response): Promise<string> {
	const body = (await response.json()) as { error: string };
	return body.error;
}

describe('validateScheduleBody', () => {
	it('returns null for a valid schedule body', () => {
		expect(
			validateScheduleBody({
				teacher_user_id: TEACHER_ID,
				scheduled_date: '2026-09-15',
				scheduled_start_time: '14:00',
				duration_minutes: 45,
			}),
		).toBeNull();
	});

	it('rejects invalid teacher, date, and duration', async () => {
		const teacherResponse = validateScheduleBody({
			teacher_user_id: 'bad',
			scheduled_date: '2026-09-15',
			scheduled_start_time: '14:00',
			duration_minutes: 45,
		});
		expect(await readError(teacherResponse as Response)).toBe('Ongeldige docent');

		const dateResponse = validateScheduleBody({
			teacher_user_id: TEACHER_ID,
			scheduled_date: '15-09-2026',
			scheduled_start_time: '14:00',
			duration_minutes: 45,
		});
		expect(await readError(dateResponse as Response)).toBe('Ongeldige datum');

		const durationResponse = validateScheduleBody({
			teacher_user_id: TEACHER_ID,
			scheduled_date: '2026-09-15',
			scheduled_start_time: '14:00',
			duration_minutes: 0,
		});
		expect(await readError(durationResponse as Response)).toBe('Ongeldige duur');
	});

	it('rejects invalid optional ids', async () => {
		const response = validateScheduleBody({
			teacher_user_id: TEACHER_ID,
			scheduled_date: '2026-09-15',
			scheduled_start_time: '14:00:00',
			duration_minutes: 45,
			signup_request_id: 'bad',
			lesson_type_id: 'bad',
			lesson_type_option_id: 'bad',
		});
		expect(await readError(response as Response)).toBe('Ongeldig request id');
	});
});

describe('validateStudentData', () => {
	it('returns null for valid student data', () => {
		expect(validateStudentData('anna@example.com', 'Anna', 'Bakker', LESSON_TYPE_ID)).toBeNull();
	});

	it('rejects invalid email, missing name, and missing lesson type', async () => {
		expect(await readError(validateStudentData('bad', 'Anna', 'Bakker', LESSON_TYPE_ID) as Response)).toBe(
			'Ongeldig e-mailadres',
		);
		expect(await readError(validateStudentData('anna@example.com', '', 'Bakker', LESSON_TYPE_ID) as Response)).toBe(
			'Naam is verplicht',
		);
		expect(await readError(validateStudentData('anna@example.com', 'Anna', 'Bakker', null) as Response)).toBe(
			'Lessoort is verplicht',
		);
	});
});

describe('computeEndTime', () => {
	it('adds duration minutes to the start time', () => {
		expect(computeEndTime('14:00', 45)).toBe('14:45');
		expect(computeEndTime('14:30', 90)).toBe('16:00');
	});
});
