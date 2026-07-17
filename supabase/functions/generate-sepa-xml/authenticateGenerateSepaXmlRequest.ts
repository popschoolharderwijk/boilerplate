import { beginAuthenticatedPostWithUuidField } from '../_shared/http.ts';
import { requireAuthenticatedClients } from '../_shared/supabase.ts';
import { requireGenerateSepaXmlRole } from './requireGenerateSepaXmlRole.ts';
import type { Body } from './types.ts';

export async function authenticateGenerateSepaXmlRequest(req: Request) {
	const begun = await beginAuthenticatedPostWithUuidField<Body>(req, (b) => b.batch_id, 'batch_id');
	if (!begun.ok) return begun;

	const auth = await requireAuthenticatedClients(begun.authHeader);
	if (!auth.ok) return { ok: false as const, response: auth.response };

	const roleError = await requireGenerateSepaXmlRole(auth.userClient, auth.user.id);
	if (roleError) return { ok: false as const, response: roleError };

	return { ok: true as const, admin: auth.admin, batchId: begun.uuid };
}
