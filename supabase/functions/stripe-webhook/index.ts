// Stripe webhook receiver. Public endpoint — verify_jwt = false.
// Verifies signature against STRIPE_WEBHOOK_SECRET and upserts subscription/invoice state.
import { handleCorsPreflight, requirePost } from '../_shared/http.ts';
import { executeStripeWebhook } from '../_shared/stripeWebhookHandler.ts';

Deno.serve(async (req) => {
	const preflight = handleCorsPreflight(req);
	if (preflight) return preflight;
	const notPost = requirePost(req);
	if (notPost) return notPost;

	return executeStripeWebhook(req);
});
