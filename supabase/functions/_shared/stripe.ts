// Shared Stripe helpers for edge functions.
// Stripe uses esm.sh — pinned major. Deno-compatible client via fetch httpClient.
import Stripe from 'https://esm.sh/stripe@17.5.0?target=deno';

export function getStripe(): Stripe {
	const key = Deno.env.get('STRIPE_SECRET_KEY');
	if (!key) throw new Error('STRIPE_SECRET_KEY ontbreekt');
	return new Stripe(key, {
		apiVersion: '2024-11-20.acacia',
		httpClient: Stripe.createFetchHttpClient(),
	});
}

export function getSafeErrorMessage(err: unknown, fallback = 'Onverwachte fout'): string {
	if (err instanceof Error) {
		// Strip stack/PII; keep first line only
		return err.message.split('\n')[0].slice(0, 300);
	}
	if (typeof err === 'string') return err.slice(0, 300);
	return fallback;
}
