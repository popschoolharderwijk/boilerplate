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

async function findIdByStripeSubscriptionId(
	admin: SupabaseClient,
	stripeSubscriptionId: string,
): Promise<string | null> {
	const { data, error } = await admin
		.from('subscriptions')
		.select('id')
		.eq('stripe_subscription_id', stripeSubscriptionId)
		.maybeSingle();
	if (error) throw error;
	return data?.id ?? null;
}

async function findIdByStripeScheduleId(admin: SupabaseClient, stripeScheduleId: string): Promise<string | null> {
	const { data, error } = await admin
		.from('subscriptions')
		.select('id')
		.eq('stripe_schedule_id', stripeScheduleId)
		.maybeSingle();
	if (error) throw error;
	return data?.id ?? null;
}

async function findActiveIdByAgreementId(admin: SupabaseClient, lessonAgreementId: string): Promise<string | null> {
	const { data, error } = await admin
		.from('subscriptions')
		.select('id')
		.eq('lesson_agreement_id', lessonAgreementId)
		.in('status', ACTIVE_SUBSCRIPTION_STATUSES)
		.order('created_at', { ascending: false })
		.limit(1)
		.maybeSingle();
	if (error) throw error;
	return data?.id ?? null;
}

async function findByOptionalStripeSubscriptionId(
	admin: SupabaseClient,
	stripeSubscriptionId: string | null,
): Promise<string | null> {
	if (!stripeSubscriptionId) return null;
	return findIdByStripeSubscriptionId(admin, stripeSubscriptionId);
}

async function findByOptionalStripeScheduleId(
	admin: SupabaseClient,
	stripeScheduleId: string | null | undefined,
): Promise<string | null> {
	if (!stripeScheduleId) return null;
	return findIdByStripeScheduleId(admin, stripeScheduleId);
}

async function findExistingSubscriptionId(admin: SupabaseClient, state: SubscriptionState): Promise<string | null> {
	return (
		(await findByOptionalStripeSubscriptionId(admin, state.stripe_subscription_id)) ??
		(await findByOptionalStripeScheduleId(admin, state.stripe_schedule_id)) ??
		(await findActiveIdByAgreementId(admin, state.lesson_agreement_id))
	);
}

export async function writeSubscriptionState(admin: SupabaseClient, state: SubscriptionState): Promise<void> {
	const existingId = await findExistingSubscriptionId(admin, state);
	const result = existingId
		? await admin.from('subscriptions').update(state).eq('id', existingId)
		: await admin.from('subscriptions').insert(state);

	if (result.error) throw result.error;
}
