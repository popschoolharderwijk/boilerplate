import { jsonResponse, UUID_RE } from '../_shared/http.ts';
import type { Body } from './types.ts';

export function validateApproveBody(body: Body): Response | null {
	if (!body.request_id || !UUID_RE.test(body.request_id)) {
		return jsonResponse(400, { error: 'Ongeldig request id' });
	}
	if (body.override_lesson_group_id != null && !UUID_RE.test(body.override_lesson_group_id)) {
		return jsonResponse(400, { error: 'Ongeldig groep id' });
	}
	return null;
}
