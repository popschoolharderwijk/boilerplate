// Edge Function to create user accounts
// Only admins and site_admins can create users
// Admins cannot assign site_admin roles
// Site_admins can assign any role

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { jsonResponse, serveAuthenticatedJsonRequest } from '../_shared/http.ts';

interface CreateUserRequest {
	email: string;
	first_name?: string;
	last_name?: string;
	phone_number?: string;
	role?: 'site_admin' | 'admin' | 'staff';
}

serveAuthenticatedJsonRequest(async (req, authHeader) => {
	const body: CreateUserRequest = await req.json();

	if (!body.email) {
		return jsonResponse(400, { error: 'Email is verplicht' });
	}

	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	if (!emailRegex.test(body.email)) {
		return jsonResponse(400, { error: 'Ongeldig e-mailadres' });
	}

	const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
	const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
	const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
		global: { headers: { Authorization: authHeader } },
		auth: { autoRefreshToken: false, persistSession: false },
	});

	const {
		data: { user: requestingUser },
		error: userError,
	} = await supabaseUser.auth.getUser();

	if (userError || !requestingUser) {
		return jsonResponse(401, { error: 'Invalid or expired token' });
	}

	const { data: rolesCheck, error: rolesCheckError } = await supabaseUser
		.from('user_roles')
		.select('role')
		.eq('user_id', requestingUser.id)
		.single();

	if (rolesCheckError || !rolesCheck?.role) {
		return jsonResponse(403, { error: 'Je hebt geen rechten om gebruikers aan te maken.' });
	}

	const requesterRole = rolesCheck.role;
	if (requesterRole !== 'admin' && requesterRole !== 'site_admin') {
		return jsonResponse(403, { error: 'Je hebt geen rechten om gebruikers aan te maken.' });
	}

	if (requesterRole === 'admin' && body.role === 'site_admin') {
		return jsonResponse(403, { error: 'Admins kunnen geen site_admin rollen toewijzen' });
	}

	const supabaseAdmin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', {
		auth: { autoRefreshToken: false, persistSession: false },
	});

	const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
		email: body.email,
		email_confirm: true,
		user_metadata: {
			first_name: body.first_name ?? null,
			last_name: body.last_name ?? null,
		},
	});

	if (createError) {
		if (createError.message.includes('already') || createError.message.includes('duplicate')) {
			return jsonResponse(409, { error: 'Een gebruiker met dit e-mailadres bestaat al.' });
		}
		return jsonResponse(400, { error: createError.message });
	}

	const createdUser = newUser.user;
	if (!createdUser) {
		return jsonResponse(500, { error: 'Gebruiker kon niet worden aangemaakt' });
	}

	if (body.phone_number) {
		const { error: profileUpdateError } = await supabaseAdmin
			.from('profiles')
			.update({ phone_number: body.phone_number })
			.eq('user_id', createdUser.id);

		if (profileUpdateError) {
			console.error('Error updating phone_number:', profileUpdateError);
		}
	}

	if (body.role) {
		const { error: roleInsertError } = await supabaseUser.from('user_roles').insert({
			user_id: createdUser.id,
			role: body.role,
		});

		if (roleInsertError) {
			console.error('Error assigning role:', roleInsertError);
			return jsonResponse(200, {
				message: 'Gebruiker aangemaakt, maar rol kon niet worden toegewezen.',
				user_id: createdUser.id,
				warning: roleInsertError.message,
			});
		}
	}

	return jsonResponse(200, {
		message: 'Gebruiker succesvol aangemaakt',
		user_id: createdUser.id,
		email: createdUser.email,
	});
});
