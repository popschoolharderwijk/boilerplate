// Stripe webhook receiver. Public endpoint — verify_jwt = false.
// Verifies signature against STRIPE_WEBHOOK_SECRET and upserts subscription/invoice state.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type Stripe from 'npm:stripe@17.5.0';
import { createScheduleForAgreement } from '../_shared/billing.ts';
import { handleCorsPreflight, jsonResponse, requirePost } from '../_shared/http.ts';
import {
	attachDefaultPaymentMethod,
	getReusablePaymentMethodIdFromSetupIntent,
	getSafeErrorMessage,
	getStripe,
	getStripeId,
} from '../_shared/stripe.ts';
import { writeSubscriptionState } from '../_shared/subscription-storage.ts';

const ALLOWED_STATUSES = new Set([
	'trialing',
	'active',
	'past_due',
	'canceled',
	'unpaid',
	'incomplete',
	'incomplete_expired',
	'paused',
]);

async function hasExistingSchedule(
	admin: ReturnType<typeof createClient>,
	lessonAgreementId: string,
): Promise<boolean> {
	const { data } = await admin
		.from('lesson_agreements')
		.select('stripe_schedule_id')
		.eq('id', lessonAgreementId)
		.maybeSingle();
	return Boolean(data?.stripe_schedule_id);
}

async function createScheduleFromSetupPaymentMethod(
	admin: ReturnType<typeof createClient>,
	stripe: Stripe,
	input: {
		lessonAgreementId: string | null;
		customerId: string | null;
		paymentMethodId: string | null;
		sourceId: string;
	},
): Promise<void> {
	if (!input.lessonAgreementId || !input.customerId || !input.paymentMethodId) {
		console.warn('setup event missing agreement/customer/payment_method', input.sourceId);
		return;
	}

	if (await hasExistingSchedule(admin, input.lessonAgreementId)) {
		console.log('schedule already exists for agreement', input.lessonAgreementId);
		return;
	}

	try {
		await attachDefaultPaymentMethod(stripe, input.customerId, input.paymentMethodId);
	} catch (e) {
		console.error('attach payment method failed', e);
		return;
	}

	await createScheduleForAgreement(admin, stripe, {
		lessonAgreementId: input.lessonAgreementId,
		customerId: input.customerId,
		defaultPaymentMethod: input.paymentMethodId,
	});
}

async function upsertSubscription(admin: ReturnType<typeof createClient>, sub: Stripe.Subscription): Promise<void> {
	const lessonAgreementId = sub.metadata?.lesson_agreement_id;
	if (!lessonAgreementId) {
		console.warn('subscription without lesson_agreement_id metadata', sub.id);
		return;
	}
	const status = ALLOWED_STATUSES.has(sub.status) ? sub.status : 'incomplete';
	const priceId = sub.items.data[0]?.price?.id ?? '';
	const pmBrand = (() => {
		const dpm = sub.default_payment_method;
		if (typeof dpm === 'object' && dpm) return dpm.type ?? null;
		return null;
	})();

	const scheduleId = typeof sub.schedule === 'string' ? sub.schedule : (sub.schedule?.id ?? null);
	const firstItem = sub.items.data[0];
	const currentPeriodStart = sub.current_period_start ?? firstItem?.current_period_start ?? null;
	const currentPeriodEnd = sub.current_period_end ?? firstItem?.current_period_end ?? null;

	await writeSubscriptionState(admin, {
		lesson_agreement_id: lessonAgreementId,
		stripe_customer_id: typeof sub.customer === 'string' ? sub.customer : sub.customer.id,
		stripe_subscription_id: sub.id,
		stripe_price_id: priceId,
		stripe_schedule_id: scheduleId,
		status,
		current_period_start: currentPeriodStart ? new Date(currentPeriodStart * 1000).toISOString() : null,
		current_period_end: currentPeriodEnd ? new Date(currentPeriodEnd * 1000).toISOString() : null,
		cancel_at: sub.cancel_at ? new Date(sub.cancel_at * 1000).toISOString() : null,
		canceled_at: sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : null,
		default_payment_method_brand: pmBrand,
		latest_invoice_id:
			typeof sub.latest_invoice === 'string' ? sub.latest_invoice : (sub.latest_invoice?.id ?? null),
	});
}

async function upsertInvoice(admin: ReturnType<typeof createClient>, inv: Stripe.Invoice): Promise<void> {
	const subId = typeof inv.subscription === 'string' ? inv.subscription : inv.subscription?.id;
	if (!subId) return; // only subscription invoices

	const { data: subRow } = await admin
		.from('subscriptions')
		.select('id')
		.eq('stripe_subscription_id', subId)
		.maybeSingle();
	if (!subRow) {
		console.warn('invoice for unknown subscription', subId);
		return;
	}

	const { error } = await admin.from('subscription_invoices').upsert(
		{
			subscription_id: subRow.id,
			stripe_invoice_id: inv.id,
			amount_due: inv.amount_due,
			amount_paid: inv.amount_paid,
			currency: inv.currency,
			status: inv.status ?? 'open',
			hosted_invoice_url: inv.hosted_invoice_url,
			invoice_pdf: inv.invoice_pdf,
			period_start: inv.period_start ? new Date(inv.period_start * 1000).toISOString() : null,
			period_end: inv.period_end ? new Date(inv.period_end * 1000).toISOString() : null,
			paid_at: inv.status_transitions?.paid_at
				? new Date(inv.status_transitions.paid_at * 1000).toISOString()
				: null,
		},
		{ onConflict: 'stripe_invoice_id' },
	);
	if (error) console.error('invoice upsert error', error);
}

Deno.serve(async (req) => {
	const preflight = handleCorsPreflight(req);
	if (preflight) return preflight;
	const notPost = requirePost(req);
	if (notPost) return notPost;

	const signature = req.headers.get('stripe-signature');
	const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
	if (!signature || !webhookSecret) return jsonResponse(400, { error: 'Missing signature/secret' });

	const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
	const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
	const admin = createClient(supabaseUrl, serviceKey, {
		auth: { autoRefreshToken: false, persistSession: false },
	});

	const stripe = getStripe();
	const rawBody = await req.text();

	let event: Stripe.Event;
	try {
		event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret);
	} catch (err) {
		console.error('signature verification failed', err);
		return jsonResponse(400, { error: `Webhook Error: ${getSafeErrorMessage(err, 'invalid signature')}` });
	}

	try {
		switch (event.type) {
			case 'customer.subscription.created':
			case 'customer.subscription.updated':
			case 'customer.subscription.deleted':
			case 'customer.subscription.paused':
			case 'customer.subscription.resumed': {
				await upsertSubscription(admin, event.data.object as Stripe.Subscription);
				break;
			}
			case 'checkout.session.completed': {
				const session = event.data.object as Stripe.Checkout.Session;
				if (session.mode === 'subscription' && session.subscription) {
					const subId =
						typeof session.subscription === 'string' ? session.subscription : session.subscription.id;
					const sub = await stripe.subscriptions.retrieve(subId, { expand: ['default_payment_method'] });
					await upsertSubscription(admin, sub);
				} else if (session.mode === 'setup' && session.metadata?.flow === 'schedule_setup') {
					// SEPA mandate just collected → attach as default + create the schedule.
					const lessonAgreementId = session.metadata.lesson_agreement_id;
					const customerId = getStripeId(session.customer);
					const setupIntentId =
						typeof session.setup_intent === 'string' ? session.setup_intent : session.setup_intent?.id;
					let pmId: string | null = null;
					if (setupIntentId) {
						const si = await stripe.setupIntents.retrieve(setupIntentId, { expand: ['latest_attempt'] });
						pmId = getReusablePaymentMethodIdFromSetupIntent(si);
					}
					await createScheduleFromSetupPaymentMethod(admin, stripe, {
						lessonAgreementId,
						customerId,
						paymentMethodId: pmId,
						sourceId: session.id,
					});
				}
				break;
			}
			case 'setup_intent.succeeded': {
				const setupIntent = event.data.object as Stripe.SetupIntent;
				if (setupIntent.metadata?.flow !== 'schedule_setup') break;
				const expandedSetupIntent = await stripe.setupIntents.retrieve(setupIntent.id, {
					expand: ['latest_attempt'],
				});
				await createScheduleFromSetupPaymentMethod(admin, stripe, {
					lessonAgreementId: expandedSetupIntent.metadata.lesson_agreement_id ?? null,
					customerId: getStripeId(expandedSetupIntent.customer),
					paymentMethodId: getReusablePaymentMethodIdFromSetupIntent(expandedSetupIntent),
					sourceId: setupIntent.id,
				});
				break;
			}
			case 'invoice.paid':
			case 'invoice.finalized':
			case 'invoice.payment_failed':
			case 'invoice.payment_succeeded': {
				await upsertInvoice(admin, event.data.object as Stripe.Invoice);
				break;
			}
			default:
				// no-op
				break;
		}
		return jsonResponse(200, { received: true });
	} catch (err) {
		console.error('webhook handler error', err);
		return jsonResponse(500, { error: getSafeErrorMessage(err, 'Webhook handler failed') });
	}
});
