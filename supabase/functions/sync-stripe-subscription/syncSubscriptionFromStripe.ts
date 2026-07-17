import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type Stripe from 'npm:stripe@17.5.0';
import { jsonResponse } from '../_shared/http.ts';
import { writeSubscriptionState } from '../_shared/subscription-storage.ts';
import { buildSubscriptionPayload } from './buildSubscriptionPayload.ts';

export async function syncSubscriptionFromStripe(
	admin: SupabaseClient,
	stripe: Stripe,
	args: {
		stripeSubscriptionId: string;
		lessonAgreementIdHint: string | null;
		scheduleIdFromDb: string | null;
	},
): Promise<Response> {
	const sub = await stripe.subscriptions.retrieve(args.stripeSubscriptionId, {
		expand: ['default_payment_method', 'latest_invoice'],
	});

	const lessonAgreementId = sub.metadata?.lesson_agreement_id ?? args.lessonAgreementIdHint;
	if (!lessonAgreementId) {
		return jsonResponse(400, { error: 'Subscription mist lesson_agreement_id metadata' });
	}

	const payload = buildSubscriptionPayload(sub, lessonAgreementId, args.scheduleIdFromDb);
	await writeSubscriptionState(admin, payload);

	return jsonResponse(200, { synced: true, status: sub.status });
}
