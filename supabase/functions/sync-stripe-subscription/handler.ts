import { beginAuthenticatedPostRequest } from '../_shared/http.ts';
import { getStripe } from '../_shared/stripe.ts';
import { createSupabaseClients, requireAdminUser } from '../_shared/supabase.ts';
import { runSyncStripeSubscriptionWithErrorHandling } from './runSyncStripeSubscription.ts';
import type { Body } from './types.ts';
import { validateSyncBody } from './validation.ts';

export async function handleSyncStripeSubscriptionRequest(req: Request): Promise<Response> {
	const begun = await beginAuthenticatedPostRequest<Body>(req);
	if (!begun.ok) return begun.response;

	const validationError = validateSyncBody(begun.body);
	if (validationError) return validationError;

	const { userClient, admin } = createSupabaseClients(begun.authHeader);
	const authn = await requireAdminUser(userClient);
	if (!authn.ok) return authn.response;

	return runSyncStripeSubscriptionWithErrorHandling(admin, getStripe(), begun.body);
}
