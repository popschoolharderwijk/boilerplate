import { type StripeSubscriptionLike, stripeTimestampToIso } from '../_shared/stripe-subscription-mapping.ts';

export function buildSubscriptionPayload(
	sub: StripeSubscriptionLike,
	lessonAgreementId: string,
	scheduleIdFromDb: string | null,
) {
	const firstItem = sub.items.data[0];
	const periods = extractPeriodTimestamps(sub, firstItem);

	return {
		lesson_agreement_id: lessonAgreementId,
		stripe_customer_id: stripeRefId(sub.customer),
		stripe_subscription_id: sub.id,
		stripe_price_id: firstItem?.price?.id ?? '',
		stripe_schedule_id: stripeRefId(sub.schedule) ?? scheduleIdFromDb ?? null,
		status: sub.status,
		current_period_start: stripeTimestampToIso(periods.start),
		current_period_end: stripeTimestampToIso(periods.end),
		cancel_at: stripeTimestampToIso(sub.cancel_at),
		canceled_at: stripeTimestampToIso(sub.canceled_at),
		default_payment_method_brand: paymentMethodBrand(sub.default_payment_method),
		latest_invoice_id: stripeRefId(sub.latest_invoice),
	};
}

function extractPeriodTimestamps(
	sub: StripeSubscriptionLike,
	firstItem: StripeSubscriptionLike['items']['data'][number] | undefined,
): { start: number | null; end: number | null } {
	return {
		start: sub.current_period_start ?? firstItem?.current_period_start ?? null,
		end: sub.current_period_end ?? firstItem?.current_period_end ?? null,
	};
}

function stripeRefId(value: string | { id?: string } | null | undefined): string | null {
	if (typeof value === 'string') return value;
	return value?.id ?? null;
}

function paymentMethodBrand(paymentMethod: StripeSubscriptionLike['default_payment_method']): string | null {
	if (typeof paymentMethod !== 'object' || !paymentMethod) return null;
	return paymentMethod.type ?? null;
}
