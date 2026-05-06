// Create a Stripe Checkout Session (mode=subscription) for a lesson_agreement.
// Auth required. Allowed initiators: privileged staff/admin or the student themselves.
// Payment methods: iDEAL (first payment + mandate) → SEPA Direct Debit (recurring).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { getSafeErrorMessage, getStripe } from '../_shared/stripe.ts';

interface Body {
	lesson_agreement_id: string;
	stripe_price_id?: string; // optional override; otherwise read from lesson_agreement
	success_url?: string;
	cancel_url?: string;
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

	// Load agreement (RLS-checked via userClient ensures caller has access)
	const { data: agreement, error: agreementErr } = await userClient
		.from('lesson_agreements')
		.select('id, student_user_id, teacher_user_id, stripe_price_id, is_active')
		.eq('id', body.lesson_agreement_id)
		.maybeSingle();
	if (agreementErr || !agreement) return json(404, { error: 'Lesovereenkomst niet gevonden' });
	if (!agreement.is_active) return json(409, { error: 'Lesovereenkomst is niet actief' });

	const priceId = body.stripe_price_id ?? agreement.stripe_price_id;
	if (!priceId) return json(400, { error: 'Geen Stripe prijs gekoppeld aan deze lesovereenkomst' });

	// Determine billing user: student is debtor by default
	const billingUserId = agreement.student_user_id;

	// Get profile (admin client; RLS irrelevant for this internal lookup)
	const { data: profile } = await admin
		.from('profiles')
		.select('email, first_name, last_name')
		.eq('user_id', billingUserId)
		.maybeSingle();
	if (!profile?.email) return json(400, { error: 'Geen e-mail bekend voor leerling' });

	try {
		const stripe = getStripe();

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

		const origin = req.headers.get('origin') ?? '';
		const successUrl = body.success_url ?? `${origin}/agreements/${agreement.id}?subscription=success`;
		const cancelUrl = body.cancel_url ?? `${origin}/agreements/${agreement.id}?subscription=canceled`;

		const session = await stripe.checkout.sessions.create({
			mode: 'subscription',
			customer: customerId,
			payment_method_types: ['ideal', 'sepa_debit'],
			payment_method_collection: 'always',
			locale: 'nl',
			line_items: [{ price: priceId, quantity: 1 }],
			subscription_data: {
				metadata: {
					lesson_agreement_id: agreement.id,
					student_user_id: agreement.student_user_id,
				},
			},
			metadata: {
				lesson_agreement_id: agreement.id,
			},
			success_url: successUrl,
			cancel_url: cancelUrl,
		});

		return json(200, { url: session.url, session_id: session.id });
	} catch (err) {
		console.error('checkout error', err);
		return json(500, { error: getSafeErrorMessage(err, 'Kon Stripe checkout niet aanmaken') });
	}
});
