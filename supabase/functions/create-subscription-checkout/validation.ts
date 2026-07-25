import { jsonResponse, UUID_RE } from '../_shared/http.ts';
import type { Body, CheckoutMode } from './types.ts';

export function validateCheckoutBody(body: Body): Response | null {
	if (!body.lesson_agreement_id || !UUID_RE.test(body.lesson_agreement_id)) {
		return jsonResponse(400, { error: 'Ongeldig lesson_agreement_id' });
	}
	return null;
}

export function resolveCheckoutMode(body: Body): CheckoutMode {
	if (body.mode === 'direct' || body.mode === 'complete') return body.mode;
	return 'checkout';
}
