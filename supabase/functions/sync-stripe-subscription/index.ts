// Manual recovery: re-fetch Stripe state and re-upsert.
// Accepts either { stripe_subscription_id } or { lesson_agreement_id }.
// For scheduled rows (no stripe_subscription_id yet) we look up the schedule
// and use its released_subscription when available.
// Admin/site_admin only.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { handleCorsPreflight, jsonResponse, requirePost } from '../_shared/http.ts';
import { getSafeErrorMessage, getStripe } from '../_shared/stripe.ts';
import { writeSubscriptionState } from '../_shared/subscription-storage.ts';

interface Body {
	stripe_subscription_id?: string;
	lesson_agreement_id?: string;
}

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
	if (!body.stripe_subscription_id && !body.lesson_agreement_id) {
		return jsonResponse(400, { error: 'Geef stripe_subscription_id of lesson_agreement_id mee' });
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
	if (userErr || !user) return jsonResponse(401, { error: 'Invalid token' });

	const { data: roleRow } = await userClient.from('user_roles').select('role').eq('user_id', user.id).single();
	const role = roleRow?.role;
	if (role !== 'admin' && role !== 'site_admin') return jsonResponse(403, { error: 'Geen rechten' });

	try {
		const stripe = getStripe();

		// Resolve target subscription id.
		let stripeSubscriptionId: string | null = body.stripe_subscription_id ?? null;
		const lessonAgreementIdHint: string | null = body.lesson_agreement_id ?? null;
		let scheduleIdFromDb: string | null = null;

		if (!stripeSubscriptionId && lessonAgreementIdHint) {
			const { data: row, error: rowErr } = await admin
				.from('subscriptions')
				.select('stripe_subscription_id, stripe_schedule_id')
				.eq('lesson_agreement_id', lessonAgreementIdHint)
				.order('created_at', { ascending: false })
				.limit(1)
				.maybeSingle();
			if (rowErr) throw rowErr;
			stripeSubscriptionId = row?.stripe_subscription_id ?? null;
			scheduleIdFromDb = row?.stripe_schedule_id ?? null;

			if (!stripeSubscriptionId && scheduleIdFromDb) {
				const schedule = await stripe.subscriptionSchedules.retrieve(scheduleIdFromDb);
				const released =
					typeof schedule.released_subscription === 'string'
						? schedule.released_subscription
						: ((schedule.subscription as string | null) ?? null);
				if (released) {
					stripeSubscriptionId = released;
				} else {
					// No subscription yet — just refresh schedule status into the row.
					return jsonResponse(200, {
						synced: false,
						info: `Schedule status is ${schedule.status}; nog geen actief abonnement gekoppeld.`,
						schedule_status: schedule.status,
					});
				}
			}
		}

		if (!stripeSubscriptionId) {
			return jsonResponse(400, { error: 'Geen Stripe-abonnement gevonden om te syncen' });
		}

		const sub = await stripe.subscriptions.retrieve(stripeSubscriptionId, {
			expand: ['default_payment_method', 'latest_invoice'],
		});

		const lessonAgreementId = sub.metadata?.lesson_agreement_id ?? lessonAgreementIdHint;
		if (!lessonAgreementId) {
			return jsonResponse(400, { error: 'Subscription mist lesson_agreement_id metadata' });
		}
		const priceId = sub.items.data[0]?.price?.id ?? '';
		const firstItem = sub.items.data[0];
		const currentPeriodStart = sub.current_period_start ?? firstItem?.current_period_start ?? null;
		const currentPeriodEnd = sub.current_period_end ?? firstItem?.current_period_end ?? null;
		const pmBrand =
			typeof sub.default_payment_method === 'object' && sub.default_payment_method
				? (sub.default_payment_method.type ?? null)
				: null;

		await writeSubscriptionState(admin, {
			lesson_agreement_id: lessonAgreementId,
			stripe_customer_id: typeof sub.customer === 'string' ? sub.customer : sub.customer.id,
			stripe_subscription_id: sub.id,
			stripe_price_id: priceId,
			stripe_schedule_id:
				typeof sub.schedule === 'string' ? sub.schedule : (sub.schedule?.id ?? scheduleIdFromDb ?? null),
			status: sub.status,
			current_period_start: currentPeriodStart ? new Date(currentPeriodStart * 1000).toISOString() : null,
			current_period_end: currentPeriodEnd ? new Date(currentPeriodEnd * 1000).toISOString() : null,
			cancel_at: sub.cancel_at ? new Date(sub.cancel_at * 1000).toISOString() : null,
			canceled_at: sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : null,
			default_payment_method_brand: pmBrand,
			latest_invoice_id:
				typeof sub.latest_invoice === 'string' ? sub.latest_invoice : (sub.latest_invoice?.id ?? null),
		});

		return jsonResponse(200, { synced: true, status: sub.status });
	} catch (err) {
		console.error('sync error', err);
		return jsonResponse(500, { error: getSafeErrorMessage(err, 'Kon subscription niet syncen') });
	}
});
