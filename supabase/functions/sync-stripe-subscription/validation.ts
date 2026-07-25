import { jsonResponse } from '../_shared/http.ts';
import type { Body } from './types.ts';

export function validateSyncBody(body: Body): Response | null {
	if (!body.stripe_subscription_id && !body.lesson_agreement_id) {
		return jsonResponse(400, { error: 'Geef stripe_subscription_id of lesson_agreement_id mee' });
	}
	return null;
}
