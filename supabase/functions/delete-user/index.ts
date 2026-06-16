// Edge Function to delete user accounts
// Supports two modes:
// 1. Self-deletion: User deletes their own account (no userId in body)
// 2. Admin deletion: Admin/site_admin deletes another user's account (userId in body)
//
// Uses admin API to delete from auth.users, which CASCADE deletes profile and roles
// The database trigger `protect_last_site_admin` prevents deleting the last site_admin

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { jsonResponse, serveAuthenticatedJsonRequest } from '../_shared/http.ts';

serveAuthenticatedJsonRequest(async (req, authHeader) => {
	const supabaseAdmin = createClient(
		Deno.env.get('SUPABASE_URL') ?? '',
		Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
		{
			auth: {
				autoRefreshToken: false,
				persistSession: false,
			},
		},
	);

	const token = authHeader.replace('Bearer ', '');
	const {
		data: { user: requestingUser },
		error: userError,
	} = await supabaseAdmin.auth.getUser(token);

	if (userError || !requestingUser) {
		return jsonResponse(401, { error: 'Invalid or expired token' });
	}

	let targetUserId = requestingUser.id;
	let body: { userId?: string } = {};

	try {
		const text = await req.text();
		if (text) {
			body = JSON.parse(text);
		}
	} catch {
		// Empty body is fine - means self-deletion
	}

	if (body.userId && body.userId !== requestingUser.id) {
		const { data: roleData, error: roleError } = await supabaseAdmin
			.from('user_roles')
			.select('role')
			.eq('user_id', requestingUser.id)
			.single();

		if (roleError || !roleData) {
			return jsonResponse(403, { error: 'Could not verify permissions' });
		}

		const allowedRoles = ['admin', 'site_admin'];
		if (!allowedRoles.includes(roleData.role)) {
			return jsonResponse(403, { error: 'Je hebt geen rechten om andere accounts te verwijderen.' });
		}

		targetUserId = body.userId;
	}

	const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);

	if (deleteError) {
		const errorMessage = deleteError.message || 'Failed to delete account';

		if (errorMessage.includes('last site_admin')) {
			return jsonResponse(400, {
				error: 'Dit is de laatste site administrator. Maak eerst een andere gebruiker site_admin voordat dit account verwijderd kan worden.',
				code: 'last_site_admin',
			});
		}

		return jsonResponse(400, { error: errorMessage });
	}

	return jsonResponse(200, { message: 'Account successfully deleted' });
});
