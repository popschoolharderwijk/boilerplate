import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getSafeErrorMessage } from '../_shared/errors.ts';
import { jsonResponse } from '../_shared/http.ts';
import { requireAuthenticatedClients, requireUserRole } from '../_shared/supabase.ts';

export async function requireScheduleTrialLessonAccess(
	authHeader: string,
): Promise<{ ok: true; admin: SupabaseClient } | { ok: false; response: Response }> {
	const auth = await requireAuthenticatedClients(authHeader);
	if (!auth.ok) return auth;

	const denied = await requireUserRole(auth.userClient, auth.user.id, ['admin', 'site_admin', 'staff']);
	if (denied) return { ok: false, response: denied };

	return { ok: true, admin: auth.admin };
}

export async function runScheduleTrialLessonSafely(run: () => Promise<Response>): Promise<Response> {
	try {
		return await run();
	} catch (err) {
		console.error('schedule-trial-lesson error', err);
		return jsonResponse(500, { error: getSafeErrorMessage(err, 'Onverwachte fout') });
	}
}
