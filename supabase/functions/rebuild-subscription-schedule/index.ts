// Recompute prices on an existing Stripe Subscription Schedule for a lesson_agreement.
// Past + currently active phases are kept verbatim; future phases are replaced
// with newly computed amounts based on current `lesson_type_options`.
//
// Auth required. Privileged staff/admin only — students cannot trigger this.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { rebuildScheduleForAgreement } from '../_shared/billing.ts';
import { handleCorsPreflight, jsonResponse, requirePost } from '../_shared/http.ts';
import { getSafeErrorMessage, getStripe } from '../_shared/stripe.ts';

interface Body {
	lesson_agreement_id?: string;
	/** Bulk: rebuild all active schedules for a given lesson_type_id. */
	lesson_type_id?: string;
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

	if (body.lesson_agreement_id && !UUID_RE.test(body.lesson_agreement_id)) {
		return jsonResponse(400, { error: 'Ongeldig lesson_agreement_id' });
	}
	if (body.lesson_type_id && !UUID_RE.test(body.lesson_type_id)) {
		return jsonResponse(400, { error: 'Ongeldig lesson_type_id' });
	}
	if (!body.lesson_agreement_id && !body.lesson_type_id) {
		return jsonResponse(400, { error: 'Geef lesson_agreement_id of lesson_type_id mee' });
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

	// Privileged check via DB helper
	const { data: privileged, error: privErr } = await userClient.rpc('is_privileged');
	if (privErr || privileged !== true) return jsonResponse(403, { error: 'Onvoldoende rechten' });

	try {
		const stripe = getStripe();

		// Resolve target agreements
		let agreementIds: string[];
		if (body.lesson_agreement_id) {
			agreementIds = [body.lesson_agreement_id];
		} else {
			const { data, error } = await admin
				.from('lesson_agreements')
				.select('id')
				.eq('lesson_type_id', body.lesson_type_id as string)
				.eq('is_active', true)
				.not('stripe_schedule_id', 'is', null);
			if (error) return jsonResponse(500, { error: error.message });
			agreementIds = (data ?? []).map((r) => r.id);
		}

		const results: Array<{ lesson_agreement_id: string; ok: boolean; detail?: unknown; error?: string }> = [];
		for (const id of agreementIds) {
			try {
				const r = await rebuildScheduleForAgreement(admin, stripe, id);
				results.push({ lesson_agreement_id: id, ok: true, detail: r });
			} catch (err) {
				results.push({
					lesson_agreement_id: id,
					ok: false,
					error: getSafeErrorMessage(err, 'rebuild faalde'),
				});
			}
		}

		const failed = results.filter((r) => !r.ok).length;
		return jsonResponse(failed === results.length && results.length > 0 ? 500 : 200, {
			processed: results.length,
			failed,
			results,
		});
	} catch (err) {
		console.error('rebuild-subscription-schedule error', err);
		return jsonResponse(500, { error: getSafeErrorMessage(err, 'Kon schedule niet bijwerken') });
	}
});
