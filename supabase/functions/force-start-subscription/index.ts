// TEST-ONLY: Force a 'scheduled' subscription to start NOW in Stripe.
// Cancels the existing Stripe Subscription Schedule and creates a fresh
// Subscription that bills immediately on the existing customer + default
// payment method. The webhook updates the local 'subscriptions' row from
// 'scheduled' to 'active' once Stripe emits customer.subscription.created.
//
// Privileged staff/admin only.
import { jsonResponse, serveLessonAgreementPost } from '../_shared/http.ts';
import { getSafeErrorMessage, getStripe, getStripeId } from '../_shared/stripe.ts';
import { writeSubscriptionState } from '../_shared/subscription-storage.ts';
import { createSupabaseClients, requirePrivilegedUser } from '../_shared/supabase.ts';

serveLessonAgreementPost(async ({ authHeader, lessonAgreementId }) => {
	const { userClient, admin } = createSupabaseClients(authHeader);

	const authn = await requirePrivilegedUser(userClient);
	if (!authn.ok) return authn.response;

	const { data: agreement, error: agErr } = await admin
		.from('lesson_agreements')
		.select('id, stripe_schedule_id')
		.eq('id', lessonAgreementId)
		.maybeSingle();
	if (agErr || !agreement) return jsonResponse(404, { error: 'Lesovereenkomst niet gevonden' });
	if (!agreement.stripe_schedule_id) {
		return jsonResponse(400, { error: 'Geen Stripe schedule gekoppeld aan deze lesovereenkomst' });
	}

	try {
		const stripe = getStripe();

		const schedule = await stripe.subscriptionSchedules.retrieve(agreement.stripe_schedule_id, {
			expand: ['phases.items.price'],
		});

		if (schedule.status !== 'not_started' && schedule.status !== 'active') {
			return jsonResponse(400, { error: `Schedule status is ${schedule.status}; kan niet geforceerd starten` });
		}

		const customerId = getStripeId(schedule.customer);
		if (!customerId) return jsonResponse(400, { error: 'Kon Stripe customer niet bepalen' });

		const firstPhase = schedule.phases?.[0];
		const firstItem = firstPhase?.items?.[0];
		const priceId = getStripeId(firstItem?.price);
		if (!priceId) return jsonResponse(400, { error: 'Kon prijs uit schedule niet lezen' });

		const phaseDpm = firstPhase?.default_payment_method;
		const defaultPaymentMethod = (phaseDpm ? getStripeId(phaseDpm) : null) ?? undefined;

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
		const itemPeriodEnd = subscription.current_period_end ?? subscription.items.data[0]?.current_period_end ?? null;
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

		await admin.from('lesson_agreements').update({ stripe_schedule_id: null }).eq('id', lessonAgreementId);

		return jsonResponse(200, {
			ok: true,
			stripe_subscription_id: subscription.id,
			status: subscription.status,
		});
	} catch (err) {
		console.error('force-start-subscription error', err);
		return jsonResponse(500, { error: getSafeErrorMessage(err, 'Kon abonnement niet forceren') });
	}
});
