// Recompute prices on an existing Stripe Subscription Schedule for a lesson_agreement.
// Past + currently active phases are kept verbatim; future phases are replaced
// with newly computed amounts based on current `lesson_type_options`.
//
// Auth required. Privileged staff/admin only — students cannot trigger this.
import { rebuildScheduleForAgreement } from '../_shared/billing.ts';
import { beginAuthenticatedPostRequest, jsonResponse, UUID_RE } from '../_shared/http.ts';
import { getSafeErrorMessage, getStripe } from '../_shared/stripe.ts';
import { createSupabaseClients, requirePrivilegedUser } from '../_shared/supabase.ts';

interface Body {
	lesson_agreement_id?: string;
	/** Bulk: rebuild all active schedules for a given lesson_type_id. */
	lesson_type_id?: string;
}

Deno.serve(async (req) => {
	const begun = await beginAuthenticatedPostRequest<Body>(req);
	if (!begun.ok) return begun.response;
	const { authHeader, body } = begun;

	if (body.lesson_agreement_id && !UUID_RE.test(body.lesson_agreement_id)) {
		return jsonResponse(400, { error: 'Ongeldig lesson_agreement_id' });
	}
	if (body.lesson_type_id && !UUID_RE.test(body.lesson_type_id)) {
		return jsonResponse(400, { error: 'Ongeldig lesson_type_id' });
	}
	if (!body.lesson_agreement_id && !body.lesson_type_id) {
		return jsonResponse(400, { error: 'Geef lesson_agreement_id of lesson_type_id mee' });
	}

	const { userClient, admin } = createSupabaseClients(authHeader);

	const authn = await requirePrivilegedUser(userClient);
	if (!authn.ok) return authn.response;

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
