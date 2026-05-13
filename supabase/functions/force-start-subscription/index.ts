// TEST-ONLY: Force a 'scheduled' subscription to start NOW in Stripe.
// Cancels the existing Stripe Subscription Schedule and creates a fresh
// Subscription that bills immediately on the existing customer + default
// payment method. The webhook updates the local 'subscriptions' row from
// 'scheduled' to 'active' once Stripe emits customer.subscription.created.
//
// Privileged staff/admin only.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { writeSubscriptionState } from '../_shared/subscription-storage.ts';
import { getSafeErrorMessage, getStripe, getStripeId } from '../_shared/stripe.ts';

interface Body {
	lesson_agreement_id?: string;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function json(status: number, payload: unknown) {
	return new Response(JSON.stringify(payload), {
		status,
		headers: { ...corsHeaders, 'Content-Type': 'application/json' },
	});
}

Deno.serve(async (req) => {
	if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });
	if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });

	const authHeader = req.headers.get('Authorization');
	if (!authHeader) return json(401, { error: 'Missing authorization header' });

	let body: Body;
	try {
		body = await req.json();
	} catch {
		return json(400, { error: 'Invalid JSON' });
	}
	if (!body.lesson_agreement_id || !UUID_RE.test(body.lesson_agreement_id)) {
		return json(400, { error: 'Ongeldig lesson_agreement_id' });
	}

	const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
	const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
	const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

	const userClient = createClient(supabaseUrl, anonKey, {
		global: { headers: { Authorization: authHeader } },
		auth: { autoRefreshToken: false, persistSession: false },
	});
	const admin = createClient(supabaseUrl, serviceKey, {
		auth: { autoRefreshToken: false, persistSession: false },
	});

	const {
		data: { user },
		error: userErr,
	} = await userClient.auth.getUser();
	if (userErr || !user) return json(401, { error: 'Invalid token' });

	const { data: privileged, error: privErr } = await userClient.rpc('is_privileged');
	if (privErr || privileged !== true) return json(403, { error: 'Onvoldoende rechten' });

	const lessonAgreementId = body.lesson_agreement_id;

	const { data: agreement, error: agErr } = await admin
		.from('lesson_agreements')
		.select('id, stripe_schedule_id')
		.eq('id', lessonAgreementId)
		.maybeSingle();
	if (agErr || !agreement) return json(404, { error: 'Lesovereenkomst niet gevonden' });
	if (!agreement.stripe_schedule_id) {
		return json(400, { error: 'Geen Stripe schedule gekoppeld aan deze lesovereenkomst' });
	}

	try {
		const stripe = getStripe();

		const schedule = await stripe.subscriptionSchedules.retrieve(agreement.stripe_schedule_id, {
			expand: ['phases.items.price'],
		});

		if (schedule.status !== 'not_started' && schedule.status !== 'active') {
			return json(400, { error: `Schedule status is ${schedule.status}; kan niet geforceerd starten` });
		}

		const customerId = getStripeId(schedule.customer);
		if (!customerId) return json(400, { error: 'Kon Stripe customer niet bepalen' });

		const firstPhase = schedule.phases?.[0];
		const firstItem = firstPhase?.items?.[0];
		const priceId = getStripeId(firstItem?.price);
		if (!priceId) return json(400, { error: 'Kon prijs uit schedule niet lezen' });

		const phaseDpm = firstPhase?.default_payment_method;
		const defaultPaymentMethod =
			(phaseDpm ? getStripeId(phaseDpm) : null) ?? undefined;

		// Cancel the schedule so it doesn't compete with the immediate subscription.
		if (schedule.status !== 'canceled') {
			await stripe.subscriptionSchedules.cancel(agreement.stripe_schedule_id);
		}

		// Create immediate subscription. Stripe will attempt collection right away.
		const subscription = await stripe.subscriptions.create({
			customer: customerId,
			items: [{ price: priceId, quantity: 1 }],
			collection_method: 'charge_automatically',
			proration_behavior: 'none',
			...(defaultPaymentMethod ? { default_payment_method: defaultPaymentMethod } : {}),
			metadata: {
				lesson_agreement_id: lessonAgreementId,
				forced_start: 'true',
				original_schedule_id: agreement.stripe_schedule_id,
			},
			expand: ['default_payment_method', 'latest_invoice'],
		});

		const itemPeriodStart =
			subscription.current_period_start ?? subscription.items.data[0]?.current_period_start ?? null;
		const itemPeriodEnd =
			subscription.current_period_end ?? subscription.items.data[0]?.current_period_end ?? null;
		const pmBrand =
			typeof subscription.default_payment_method === 'object' && subscription.default_payment_method
				? (subscription.default_payment_method.type ?? null)
				: null;

		await writeSubscriptionState(admin, {
			lesson_agreement_id: lessonAgreementId,
			stripe_customer_id: customerId,
			stripe_subscription_id: subscription.id,
			stripe_price_id: priceId,
			stripe_schedule_id: null,
			status: subscription.status,
			current_period_start: itemPeriodStart ? new Date(itemPeriodStart * 1000).toISOString() : null,
			current_period_end: itemPeriodEnd ? new Date(itemPeriodEnd * 1000).toISOString() : null,
			cancel_at: subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : null,
			canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
			default_payment_method_brand: pmBrand,
			latest_invoice_id:
				typeof subscription.latest_invoice === 'string'
					? subscription.latest_invoice
					: (subscription.latest_invoice?.id ?? null),
		});

		await admin
			.from('lesson_agreements')
			.update({ stripe_schedule_id: null })
			.eq('id', lessonAgreementId);

		return json(200, {
			ok: true,
			stripe_subscription_id: subscription.id,
			status: subscription.status,
		});
	} catch (err) {
		console.error('force-start-subscription error', err);
		return json(500, { error: getSafeErrorMessage(err, 'Kon abonnement niet forceren') });
	}
});
