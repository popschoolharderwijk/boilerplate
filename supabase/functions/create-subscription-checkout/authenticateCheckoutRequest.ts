import { beginAuthenticatedPostRequest } from '../_shared/http.ts';
import { createSupabaseClients, requireAuthenticatedUser } from '../_shared/supabase.ts';
import { loadAgreementContext } from './loadAgreementContext.ts';
import type { Body } from './types.ts';
import { resolveCheckoutMode, validateCheckoutBody } from './validation.ts';

type CheckoutClients = ReturnType<typeof createSupabaseClients>;
type LoadedAgreement = Extract<Awaited<ReturnType<typeof loadAgreementContext>>, { ok: true }>;

async function beginCheckoutRequest(
	req: Request,
): Promise<{ ok: true; body: Body; authHeader: string } | { ok: false; response: Response }> {
	const begun = await beginAuthenticatedPostRequest<Body>(req);
	if (!begun.ok) return { ok: false, response: begun.response };

	const validationError = validateCheckoutBody(begun.body);
	if (validationError) return { ok: false, response: validationError };

	return { ok: true, body: begun.body, authHeader: begun.authHeader };
}

async function authenticateCheckoutClients(
	authHeader: string,
): Promise<{ ok: true; clients: CheckoutClients } | { ok: false; response: Response }> {
	const clients = createSupabaseClients(authHeader);
	const authn = await requireAuthenticatedUser(clients.userClient);
	if (!authn.ok) return { ok: false, response: authn.response };
	return { ok: true, clients };
}

export async function authenticateCheckoutRequest(req: Request): Promise<
	| {
			ok: true;
			mode: ReturnType<typeof resolveCheckoutMode>;
			clients: CheckoutClients;
			loaded: LoadedAgreement;
			body: Body;
	  }
	| { ok: false; response: Response }
> {
	const begun = await beginCheckoutRequest(req);
	if (!begun.ok) return begun;

	const auth = await authenticateCheckoutClients(begun.authHeader);
	if (!auth.ok) return auth;

	const loaded = await loadAgreementContext(
		auth.clients.userClient,
		auth.clients.admin,
		begun.body.lesson_agreement_id,
	);
	if (!loaded.ok) return { ok: false, response: loaded.response };

	return {
		ok: true,
		mode: resolveCheckoutMode(begun.body),
		clients: auth.clients,
		loaded,
		body: begun.body,
	};
}
