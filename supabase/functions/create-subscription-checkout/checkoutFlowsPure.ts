import { jsonResponse } from '../_shared/http.ts';

export function validateCompleteCheckoutSessionId(checkoutSessionId: string | undefined): Response | null {
	if (!checkoutSessionId?.startsWith('cs_')) {
		return jsonResponse(400, { error: 'Ongeldige checkout sessie' });
	}
	return null;
}

export interface CompleteCheckoutSessionLike {
	mode: string;
	metadata?: { lesson_agreement_id?: string } | null;
}

export function validateCompleteCheckoutSessionMatch(
	session: CompleteCheckoutSessionLike,
	agreementId: string,
): Response | null {
	if (session.mode !== 'setup' || session.metadata?.lesson_agreement_id !== agreementId) {
		return jsonResponse(409, { error: 'Checkout sessie hoort niet bij deze lesovereenkomst' });
	}
	return null;
}

export function resolveDirectModePaymentMethodId(defaultPm: string | { id: string } | null | undefined): string | null {
	if (typeof defaultPm === 'string') return defaultPm;
	return defaultPm?.id ?? null;
}

export function buildCheckoutSessionUrls(
	origin: string,
	agreementId: string,
	body: { success_url?: string; cancel_url?: string },
): { successUrl: string; cancelUrl: string } {
	return {
		successUrl:
			body.success_url ?? `${origin}/incasso/start?agreement=${agreementId}&session_id={CHECKOUT_SESSION_ID}`,
		cancelUrl: body.cancel_url ?? `${origin}/agreements/${agreementId}?subscription=canceled`,
	};
}

export function resolveExistingScheduleResponse(scheduleId: string | null | undefined): Response | null {
	if (!scheduleId) return null;
	return jsonResponse(200, { mode: 'complete', schedule_id: scheduleId });
}

export function validateCompleteModePaymentReady(
	customerId: string | null,
	paymentMethodId: string | null,
): Response | null {
	if (!customerId || !paymentMethodId) {
		return jsonResponse(409, { error: 'Betaalmethode is nog niet beschikbaar in Stripe' });
	}
	return null;
}

export function buildStripeCustomerDisplayName(firstName: string | null, lastName: string | null): string | undefined {
	const name = [firstName, lastName].filter(Boolean).join(' ');
	return name || undefined;
}

export function buildCompleteModeSuccessResponse(built: {
	scheduleId: string;
	subscriptionId?: string | null;
}): Response {
	return jsonResponse(200, {
		mode: 'complete',
		schedule_id: built.scheduleId,
		subscription_id: built.subscriptionId,
	});
}

export function buildDirectModeSuccessResponse(built: {
	scheduleId: string;
	subscriptionId?: string | null;
	yearly: { yearlyCents: number; monthlyCents: number; lessonsCount: number };
	periodStart: string;
	periodEnd: string;
	tariff: unknown;
}): Response {
	return jsonResponse(200, {
		mode: 'direct',
		schedule_id: built.scheduleId,
		subscription_id: built.subscriptionId,
		yearly_cents: built.yearly.yearlyCents,
		monthly_cents: built.yearly.monthlyCents,
		lessons_count: built.yearly.lessonsCount,
		period: { start: built.periodStart, end: built.periodEnd },
		tariff: built.tariff,
	});
}

export function resolveSetupIntentPaymentMethodId<T extends { id?: string }>(
	setupIntent: string | T | null | undefined,
	extractPaymentMethodId: (intent: T) => string | null,
): string | null {
	if (typeof setupIntent !== 'object' || !setupIntent) return null;
	return extractPaymentMethodId(setupIntent);
}
