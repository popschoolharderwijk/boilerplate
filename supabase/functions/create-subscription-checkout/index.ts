// Create a Stripe billing flow for a lesson_agreement.
// Two modes:
//   - mode: 'checkout'  → Stripe Checkout in `setup` mode (iDEAL→SEPA mandate);
//                         the schedule is created by the webhook on completion.
//   - mode: 'direct'    → Build the Subscription Schedule immediately on the
//                         customer's existing default payment method.
//
// Auth required. Allowed initiators: privileged staff/admin or the student themselves.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createScheduleForAgreement } from '../_shared/billing.ts';
import { handleCorsPreflight, jsonResponse, requirePost } from '../_shared/http.ts';
import {
	attachDefaultPaymentMethod,
	getReusablePaymentMethodIdFromSetupIntent,
	getSafeErrorMessage,
	getStripe,
	getStripeId,
} from '../_shared/stripe.ts';

interface Body {
	lesson_agreement_id: string;
	mode?: 'checkout' | 'direct' | 'complete';
	checkout_session_id?: string;
	success_url?: string;
	cancel_url?: string;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
	const preflight = handleCorsPreflight(req);
	if (preflight) return preflight;
	const notPost = requirePost(req);
	if (notPost) return notPost;

	const authHeader = req.headers.get('Authorization');
	if (!authHeader) return jsonResponse(401, { error: 'Missing authorization header' });

	let body: Body;
	try {
		body = await req.json();
	} catch {
		return jsonResponse(400, { error: 'Invalid JSON' });
	}
	if (!body.lesson_agreement_id || !UUID_RE.test(body.lesson_agreement_id)) {
		return jsonResponse(400, { error: 'Ongeldig lesson_agreement_id' });
	}
	const mode: 'checkout' | 'direct' | 'complete' =
		body.mode === 'direct' || body.mode === 'complete' ? body.mode : 'checkout';

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
	if (userErr || !user) return jsonResponse(401, { error: 'Invalid token' });

	// RLS-checked agreement load (caller must have access)
	const { data: agreement, error: agreementErr } = await userClient
		.from('lesson_agreements')
		.select('id, student_user_id, is_active')
		.eq('id', body.lesson_agreement_id)
		.maybeSingle();
	if (agreementErr || !agreement) return jsonResponse(404, { error: 'Lesovereenkomst niet gevonden' });
	if (!agreement.is_active) return jsonResponse(409, { error: 'Lesovereenkomst is niet actief' });

	const billingUserId = agreement.student_user_id;

	const { data: profile } = await admin
		.from('profiles')
		.select('email, first_name, last_name')
		.eq('user_id', billingUserId)
		.maybeSingle();
	if (!profile?.email) return jsonResponse(400, { error: 'Geen e-mail bekend voor leerling' });

	try {
		const stripe = getStripe();

		if (mode === 'complete') {
			if (!body.checkout_session_id || !body.checkout_session_id.startsWith('cs_')) {
				return jsonResponse(400, { error: 'Ongeldige checkout sessie' });
			}

			const { data: existingAgreement } = await admin
				.from('lesson_agreements')
				.select('stripe_schedule_id')
				.eq('id', agreement.id)
				.maybeSingle();
			if (existingAgreement?.stripe_schedule_id) {
				return jsonResponse(200, { mode: 'complete', schedule_id: existingAgreement.stripe_schedule_id });
			}

			const session = await stripe.checkout.sessions.retrieve(body.checkout_session_id, {
				expand: ['setup_intent.latest_attempt'],
			});
			if (session.mode !== 'setup' || session.metadata?.lesson_agreement_id !== agreement.id) {
				return jsonResponse(409, { error: 'Checkout sessie hoort niet bij deze lesovereenkomst' });
			}

			const customerId = getStripeId(session.customer);
			const setupIntent = session.setup_intent;
			const paymentMethodId =
				typeof setupIntent === 'object' && setupIntent
					? getReusablePaymentMethodIdFromSetupIntent(setupIntent)
					: null;
			if (!customerId || !paymentMethodId) {
				return jsonResponse(409, { error: 'Betaalmethode is nog niet beschikbaar in Stripe' });
			}

			try {
				await attachDefaultPaymentMethod(stripe, customerId, paymentMethodId);
			} catch (e) {
				console.error('attach payment method failed', e);
				return jsonResponse(409, { error: getSafeErrorMessage(e, 'Kon betaalmethode niet koppelen aan klant') });
			}
			const built = await createScheduleForAgreement(admin, stripe, {
				lessonAgreementId: agreement.id,
				customerId,
				defaultPaymentMethod: paymentMethodId,
			});
			return jsonResponse(200, {
				mode: 'complete',
				schedule_id: built.scheduleId,
				subscription_id: built.subscriptionId,
			});
		}

		// Find or create Stripe Customer
		const { data: existingCustomer } = await admin
			.from('stripe_customers')
			.select('stripe_customer_id')
			.eq('user_id', billingUserId)
			.maybeSingle();

		let customerId = existingCustomer?.stripe_customer_id ?? null;
		if (!customerId) {
			const customer = await stripe.customers.create({
				email: profile.email,
				name: [profile.first_name, profile.last_name].filter(Boolean).join(' ') || undefined,
				metadata: { user_id: billingUserId },
			});
			customerId = customer.id;
			await admin.from('stripe_customers').insert({ user_id: billingUserId, stripe_customer_id: customerId });
		}

		if (mode === 'direct') {
			// Verify the customer has a usable default payment method
			const customer = await stripe.customers.retrieve(customerId);
			if (customer.deleted) return jsonResponse(400, { error: 'Stripe customer is verwijderd' });
			const defaultPm = customer.invoice_settings?.default_payment_method;
			const defaultPmId = typeof defaultPm === 'string' ? defaultPm : defaultPm?.id;
			if (!defaultPmId) {
				return jsonResponse(409, {
					error: 'Geen standaard betaalmethode op deze klant. Start eerst een checkout om een SEPA-mandaat te koppelen.',
				});
			}

			const built = await createScheduleForAgreement(admin, stripe, {
				lessonAgreementId: agreement.id,
				customerId,
				defaultPaymentMethod: defaultPmId,
			});

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

		// mode === 'checkout' → setup-mode session for SEPA mandate
		const origin = req.headers.get('origin') ?? '';
		const successUrl =
			body.success_url ?? `${origin}/incasso/start?agreement=${agreement.id}&session_id={CHECKOUT_SESSION_ID}`;
		const cancelUrl = body.cancel_url ?? `${origin}/agreements/${agreement.id}?subscription=canceled`;

		const session = await stripe.checkout.sessions.create({
			mode: 'setup',
			customer: customerId,
			payment_method_types: ['ideal', 'sepa_debit'],
			locale: 'nl',
			currency: 'eur',
			setup_intent_data: {
				metadata: {
					lesson_agreement_id: agreement.id,
					flow: 'schedule_setup',
				},
			},
			metadata: {
				lesson_agreement_id: agreement.id,
				flow: 'schedule_setup',
			},
			success_url: successUrl,
			cancel_url: cancelUrl,
		});

		return jsonResponse(200, { mode: 'checkout', url: session.url, session_id: session.id });
	} catch (err) {
		console.error('checkout/schedule error', err);
		return jsonResponse(500, { error: getSafeErrorMessage(err, 'Kon Stripe flow niet starten') });
	}
});
