// Shared Stripe helpers for Edge Functions.
// Use Stripe's npm package directly to avoid esm.sh's Node polyfill that crashes
// Supabase Edge Runtime with `Deno.core.runMicrotasks() is not supported`.
import Stripe from 'npm:stripe@17.5.0';

export { getSafeErrorMessage } from './errors.ts';

export function getStripe(): Stripe {
	const key = Deno.env.get('STRIPE_SECRET_KEY');
	if (!key) throw new Error('STRIPE_SECRET_KEY ontbreekt');
	return new Stripe(key, {
		apiVersion: '2024-11-20.acacia',
		httpClient: Stripe.createFetchHttpClient(),
	});
}
