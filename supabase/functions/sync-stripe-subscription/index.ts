// Manual recovery: re-fetch a Stripe subscription by id and re-upsert state.
// Admin/site_admin only.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { getSafeErrorMessage, getStripe } from '../_shared/stripe.ts';
import { writeSubscriptionState } from '../_shared/subscription-storage.ts';

interface Body {
	stripe_subscription_id: string;
}

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
	if (!body.stripe_subscription_id || typeof body.stripe_subscription_id !== 'string') {
		return json(400, { error: 'Ongeldig stripe_subscription_id' });
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

	const { data: roleRow } = await userClient.from('user_roles').select('role').eq('user_id', user.id).single();
	const role = roleRow?.role;
	if (role !== 'admin' && role !== 'site_admin') return json(403, { error: 'Geen rechten' });

	try {
		const stripe = getStripe();
		const sub = await stripe.subscriptions.retrieve(body.stripe_subscription_id, {
			expand: ['default_payment_method', 'latest_invoice'],
		});

		const lessonAgreementId = sub.metadata?.lesson_agreement_id;
		if (!lessonAgreementId) {
			return json(400, { error: 'Subscription mist lesson_agreement_id metadata' });
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
			stripe_schedule_id: typeof sub.schedule === 'string' ? sub.schedule : (sub.schedule?.id ?? null),
			status: sub.status,
			current_period_start: currentPeriodStart ? new Date(currentPeriodStart * 1000).toISOString() : null,
			current_period_end: currentPeriodEnd ? new Date(currentPeriodEnd * 1000).toISOString() : null,
			cancel_at: sub.cancel_at ? new Date(sub.cancel_at * 1000).toISOString() : null,
			canceled_at: sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : null,
			default_payment_method_brand: pmBrand,
			latest_invoice_id:
				typeof sub.latest_invoice === 'string' ? sub.latest_invoice : (sub.latest_invoice?.id ?? null),
		});

		return json(200, { synced: true });
	} catch (err) {
		console.error('sync error', err);
		return json(500, { error: getSafeErrorMessage(err, 'Kon subscription niet syncen') });
	}
});
