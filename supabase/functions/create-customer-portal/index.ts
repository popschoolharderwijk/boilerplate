// Create a Stripe Billing Portal session for the calling user.
// Privileged staff may pass user_id to open portal on behalf of a leerling.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { handleCorsPreflight, jsonResponse, requirePost } from '../_shared/http.ts';
import { getSafeErrorMessage, getStripe } from '../_shared/stripe.ts';

interface Body {
	user_id?: string; // optional for staff
	return_url?: string;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
	const preflight = handleCorsPreflight(req);
	if (preflight) return preflight;
	const notPost = requirePost(req);
	if (notPost) return notPost;

	const authHeader = req.headers.get('Authorization');
	if (!authHeader) return jsonResponse(401, { error: 'Missing authorization header' });

	let body: Body = {};
	try {
		body = (await req.json().catch(() => ({}))) as Body;
	} catch {
		body = {};
	}
	if (body.user_id && !UUID_RE.test(body.user_id)) return jsonResponse(400, { error: 'Ongeldig user_id' });

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

	let targetUserId = user.id;
	if (body.user_id && body.user_id !== user.id) {
		const { data: roleRow } = await userClient.from('user_roles').select('role').eq('user_id', user.id).single();
		const role = roleRow?.role;
		if (role !== 'staff' && role !== 'admin' && role !== 'site_admin') {
			return jsonResponse(403, { error: 'Geen rechten om portal voor andere gebruiker te openen' });
		}
		targetUserId = body.user_id;
	}

	const { data: customerRow } = await admin
		.from('stripe_customers')
		.select('stripe_customer_id')
		.eq('user_id', targetUserId)
		.maybeSingle();
	if (!customerRow?.stripe_customer_id) {
		return jsonResponse(404, { error: 'Geen Stripe klant gekoppeld' });
	}

	try {
		const stripe = getStripe();
		const origin = req.headers.get('origin') ?? '';
		const session = await stripe.billingPortal.sessions.create({
			customer: customerRow.stripe_customer_id,
			return_url: body.return_url ?? `${origin}/mijn-profiel`,
		});
		return jsonResponse(200, { url: session.url });
	} catch (err) {
		console.error('portal error', err);
		return jsonResponse(500, { error: getSafeErrorMessage(err, 'Kon klantportaal niet openen') });
	}
});
