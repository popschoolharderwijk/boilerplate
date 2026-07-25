import { describe, expect, it } from 'bun:test';
import {
	normalizeSubscriptionStatus,
	type StripeSubscriptionLike,
	stripeTimestampToIso,
	subscriptionToState,
} from '../../../supabase/functions/_shared/stripe-subscription-mapping';

const baseSubscription: StripeSubscriptionLike = {
	id: 'sub_1',
	status: 'active',
	metadata: { lesson_agreement_id: 'agreement-1' },
	customer: 'cus_1',
	items: {
		data: [
			{
				price: { id: 'price_1' },
				current_period_start: 1_700_000_000,
				current_period_end: 1_700_086_400,
			},
		],
	},
};

describe('normalizeSubscriptionStatus', () => {
	it('returns known statuses unchanged', () => {
		expect(normalizeSubscriptionStatus('active')).toBe('active');
		expect(normalizeSubscriptionStatus('trialing')).toBe('trialing');
	});

	it('maps unknown statuses to incomplete', () => {
		expect(normalizeSubscriptionStatus('unknown')).toBe('incomplete');
	});
});

describe('stripeTimestampToIso', () => {
	it('converts unix seconds to ISO string', () => {
		expect(stripeTimestampToIso(0)).toBe('1970-01-01T00:00:00.000Z');
	});

	it('returns null for missing values', () => {
		expect(stripeTimestampToIso(null)).toBeNull();
		expect(stripeTimestampToIso(undefined)).toBeNull();
	});
});

describe('subscriptionToState', () => {
	it('maps subscription fields to storage payload', () => {
		const state = subscriptionToState({
			...baseSubscription,
			schedule: 'sched_1',
			cancel_at: 1_700_100_000,
			default_payment_method: { type: 'sepa_debit' },
			latest_invoice: { id: 'inv_1' },
		});

		expect(state).toEqual({
			lesson_agreement_id: 'agreement-1',
			stripe_customer_id: 'cus_1',
			stripe_subscription_id: 'sub_1',
			stripe_price_id: 'price_1',
			stripe_schedule_id: 'sched_1',
			status: 'active',
			current_period_start: stripeTimestampToIso(1_700_000_000),
			current_period_end: stripeTimestampToIso(1_700_086_400),
			cancel_at: stripeTimestampToIso(1_700_100_000),
			canceled_at: null,
			default_payment_method_brand: 'sepa_debit',
			latest_invoice_id: 'inv_1',
		});
	});

	it('returns null when lesson agreement metadata is missing', () => {
		expect(subscriptionToState({ ...baseSubscription, metadata: {} })).toBeNull();
	});
});
