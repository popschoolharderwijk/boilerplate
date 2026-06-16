// Create a Stripe Billing Portal session for the calling user.
// Privileged staff may pass user_id to open portal on behalf of a student.
import { handleCorsPreflight, jsonResponse, requireAuthHeader, requirePost, UUID_RE } from '../_shared/http.ts';
import { getSafeErrorMessage, getStripe } from '../_shared/stripe.ts';
import { createSupabaseClients, fetchUserRole, requireAuthenticatedUser } from '../_shared/supabase.ts';

interface Body {
	user_id?: string; // optional for staff
	return_url?: string;
}

Deno.serve(async (req) => {
	const preflight = handleCorsPreflight(req);
	if (preflight) return preflight;
	const notPost = requirePost(req);
	if (notPost) return notPost;

	const authHeader = requireAuthHeader(req);
	if (authHeader instanceof Response) return authHeader;

	let body: Body = {};
	try {
		body = (await req.json().catch(() => ({}))) as Body;
	} catch {
		body = {};
	}
	if (body.user_id && !UUID_RE.test(body.user_id)) return jsonResponse(400, { error: 'Ongeldig user_id' });

	const { userClient, admin } = createSupabaseClients(authHeader);

	const authn = await requireAuthenticatedUser(userClient);
	if (!authn.ok) return authn.response;
	const { user } = authn;

	let targetUserId = user.id;
	if (body.user_id && body.user_id !== user.id) {
		const role = await fetchUserRole(userClient, user.id);
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
