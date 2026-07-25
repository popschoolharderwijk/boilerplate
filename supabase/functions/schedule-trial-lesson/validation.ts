import { jsonResponse, UUID_RE } from '../_shared/http.ts';
import type { Body } from './types.ts';

export function validateScheduleBody(body: Body): Response | null {
	if (!body.teacher_user_id || !UUID_RE.test(body.teacher_user_id)) {
		return jsonResponse(400, { error: 'Ongeldige docent' });
	}
	if (!body.scheduled_date || !/^\d{4}-\d{2}-\d{2}$/.test(body.scheduled_date)) {
		return jsonResponse(400, { error: 'Ongeldige datum' });
	}
	if (!body.scheduled_start_time || !/^\d{2}:\d{2}(:\d{2})?$/.test(body.scheduled_start_time)) {
		return jsonResponse(400, { error: 'Ongeldige tijd' });
	}
	if (!Number.isInteger(body.duration_minutes) || body.duration_minutes <= 0) {
		return jsonResponse(400, { error: 'Ongeldige duur' });
	}
	if (body.signup_request_id && !UUID_RE.test(body.signup_request_id)) {
		return jsonResponse(400, { error: 'Ongeldig request id' });
	}
	if (body.lesson_type_id && !UUID_RE.test(body.lesson_type_id)) {
		return jsonResponse(400, { error: 'Ongeldige lessoort' });
	}
	if (body.lesson_type_option_id && !UUID_RE.test(body.lesson_type_option_id)) {
		return jsonResponse(400, { error: 'Ongeldige optie' });
	}
	return null;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateStudentData(
	studentEmail: string | null,
	studentFirstName: string | null,
	studentLastName: string | null,
	lessonTypeId: string | null,
): Response | null {
	if (!studentEmail || !EMAIL_RE.test(studentEmail)) {
		return jsonResponse(400, { error: 'Ongeldig e-mailadres' });
	}
	if (!studentFirstName || !studentLastName) {
		return jsonResponse(400, { error: 'Naam is verplicht' });
	}
	if (!lessonTypeId) {
		return jsonResponse(400, { error: 'Lessoort is verplicht' });
	}
	return null;
}

export function computeEndTime(startTime: string, durationMinutes: number): string {
	const [hh, mm] = startTime.split(':').map(Number);
	const startTotal = hh * 60 + mm;
	const endTotal = startTotal + durationMinutes;
	return `${String(Math.floor(endTotal / 60)).padStart(2, '0')}:${String(endTotal % 60).padStart(2, '0')}`;
}
