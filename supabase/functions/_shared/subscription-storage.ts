import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ACTIVE_SUBSCRIPTION_STATUSES = ['scheduled', 'trialing', 'active', 'past_due', 'unpaid', 'incomplete', 'paused'];

export interface SubscriptionState {
	lesson_agreement_id: string;
	stripe_customer_id: string;
	stripe_subscription_id: string | null;
	stripe_price_id: string;
	stripe_schedule_id?: string | null;
	status: string;
	current_period_start?: string | null;
	current_period_end?: string | null;
	cancel_at?: string | null;
	canceled_at?: string | null;
	default_payment_method_brand?: string | null;
	latest_invoice_id?: string | null;
}

async function findExistingSubscriptionId(
	admin: SupabaseClient,
	state: SubscriptionState,
): Promise<string | null> {
	if (state.stripe_subscription_id) {
		const { data, error } = await admin
			.from('subscriptions')
			.select('id')
			.eq('stripe_subscription_id', state.stripe_subscription_id)
			.maybeSingle();
		if (error) throw error;
		if (data?.id) return data.id;
	}

	if (state.stripe_schedule_id) {
		const { data, error } = await admin
			.from('subscriptions')
			.select('id')
			.eq('stripe_schedule_id', state.stripe_schedule_id)
			.maybeSingle();
		if (error) throw error;
		if (data?.id) return data.id;
	}

	const { data, error } = await admin
		.from('subscriptions')
		.select('id')
		.eq('lesson_agreement_id', state.lesson_agreement_id)
		.in('status', ACTIVE_SUBSCRIPTION_STATUSES)
		.order('created_at', { ascending: false })
		.limit(1)
		.maybeSingle();
	if (error) throw error;
	return data?.id ?? null;
}

export async function writeSubscriptionState(admin: SupabaseClient, state: SubscriptionState): Promise<void> {
	const existingId = await findExistingSubscriptionId(admin, state);
	const result = existingId
		? await admin.from('subscriptions').update(state).eq('id', existingId)
		: await admin.from('subscriptions').insert(state);

	if (result.error) throw result.error;
}