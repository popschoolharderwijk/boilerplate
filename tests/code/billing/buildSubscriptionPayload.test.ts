import { describe, expect, it } from 'bun:test';
import { buildSubscriptionPayload } from '../../../supabase/functions/sync-stripe-subscription/buildSubscriptionPayload';

type StripeSubscriptionInput = Parameters<typeof buildSubscriptionPayload>[0];

function mockSubscription(overrides: Partial<StripeSubscriptionInput> = {}): StripeSubscriptionInput {
	return {
		id: 'sub_123',
		status: 'active',
		customer: 'cus_abc',
		schedule: 'sched_abc',
		cancel_at: null,
		canceled_at: null,
		current_period_start: 1_700_000_000,
		current_period_end: 1_700_086_400,
		default_payment_method: { type: 'sepa_debit' },
		latest_invoice: 'inv_abc',
		items: {
			data: [
				{
					price: { id: 'price_123' },
					current_period_start: 1_700_100_000,
					current_period_end: 1_700_186_400,
				},
			],
		},
		...overrides,
	};
}

describe('buildSubscriptionPayload', () => {
	it('maps subscription refs and period timestamps from the subscription root', () => {
		const start = 1_700_000_000;
		const end = 1_700_086_400;
		expect(buildSubscriptionPayload(mockSubscription(), 'agreement-1', 'sched_db')).toEqual({
			lesson_agreement_id: 'agreement-1',
			stripe_customer_id: 'cus_abc',
			stripe_subscription_id: 'sub_123',
			stripe_price_id: 'price_123',
			stripe_schedule_id: 'sched_abc',
			status: 'active',
			current_period_start: new Date(start * 1000).toISOString(),
			current_period_end: new Date(end * 1000).toISOString(),
			cancel_at: null,
			canceled_at: null,
			default_payment_method_brand: 'sepa_debit',
			latest_invoice_id: 'inv_abc',
		});
	});

	it('falls back to item period timestamps and expanded stripe refs', () => {
		const itemStart = 1_700_400_000;
		const itemEnd = 1_700_486_400;
		const cancelAt = 1_700_200_000;
		const canceledAt = 1_700_300_000;
		const payload = buildSubscriptionPayload(
			mockSubscription({
				customer: { id: 'cus_obj' },
				schedule: { id: 'sched_obj' },
				latest_invoice: { id: 'inv_obj' },
				current_period_start: null,
				current_period_end: null,
				cancel_at: cancelAt,
				canceled_at: canceledAt,
				default_payment_method: 'pm_123',
				items: {
					data: [
						{
							price: { id: 'price_item' },
							current_period_start: itemStart,
							current_period_end: itemEnd,
						},
					],
				},
			}),
			'agreement-2',
			null,
		);

		expect(payload.stripe_customer_id).toBe('cus_obj');
		expect(payload.stripe_schedule_id).toBe('sched_obj');
		expect(payload.latest_invoice_id).toBe('inv_obj');
		expect(payload.current_period_start).toBe(new Date(itemStart * 1000).toISOString());
		expect(payload.current_period_end).toBe(new Date(itemEnd * 1000).toISOString());
		expect(payload.cancel_at).toBe(new Date(cancelAt * 1000).toISOString());
		expect(payload.canceled_at).toBe(new Date(canceledAt * 1000).toISOString());
		expect(payload.default_payment_method_brand).toBeNull();
	});

	it('uses the database schedule id when stripe schedule is missing', () => {
		const payload = buildSubscriptionPayload(
			mockSubscription({
				schedule: null,
				current_period_start: null,
				current_period_end: null,
				items: { data: [] },
			}),
			'agreement-3',
			'sched_db',
		);

		expect(payload.stripe_schedule_id).toBe('sched_db');
		expect(payload.stripe_price_id).toBe('');
		expect(payload.current_period_start).toBeNull();
		expect(payload.current_period_end).toBeNull();
	});
});
