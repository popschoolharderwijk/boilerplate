// Approve a lesson signup request (staff only).
// - Creates auth user + profile + student record (if no user exists yet for the email)
// - For group requests: inserts lesson_group_members (trigger auto-creates lesson_agreement)
// - For individual requests: marks request approved; staff completes via AgreementWizard
//   (wizard prefills using fromRequest=<id>)
// Marks the request as approved and links created_agreement_id when applicable.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

interface Body {
	request_id: string;
	/** Optional: enroll the student in this group instead of the one originally requested. */
	override_lesson_group_id?: string | null;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function json(status: number, payload: unknown) {
	return new Response(JSON.stringify(payload), {
		status,
		headers: { ...corsHeaders, 'Content-Type': 'application/json' },
	});
}

Deno.serve(async (req) => {
	if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });
	if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });

	const authHeader = req.headers.get('Authorization');
	if (!authHeader) return json(401, { error: 'Missing authorization header' });

	let body: Body;
	try {
		body = await req.json();
	} catch {
		return json(400, { error: 'Invalid JSON' });
	}
	if (!body.request_id || !UUID_RE.test(body.request_id)) return json(400, { error: 'Ongeldig request id' });
	if (body.override_lesson_group_id != null && !UUID_RE.test(body.override_lesson_group_id)) {
		return json(400, { error: 'Ongeldig groep id' });
	}

	const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
	const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
	const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

	const userClient = createClient(supabaseUrl, anonKey, {
		global: { headers: { Authorization: authHeader } },
		auth: { autoRefreshToken: false, persistSession: false },
	});
	const admin = createClient(supabaseUrl, serviceKey, {
		auth: { autoRefreshToken: false, persistSession: false },
	});

	// Authn + authz check
	const {
		data: { user },
		error: userErr,
	} = await userClient.auth.getUser();
	if (userErr || !user) return json(401, { error: 'Invalid token' });

	const { data: roleRow } = await userClient
		.from('user_roles')
		.select('role')
		.eq('user_id', user.id)
		.single();
	const role = roleRow?.role;
	if (role !== 'admin' && role !== 'site_admin') return json(403, { error: 'Geen rechten' });

	// Load request
	const { data: reqRow, error: reqErr } = await admin
		.from('lesson_signup_requests')
		.select('*')
		.eq('id', body.request_id)
		.single();
	if (reqErr || !reqRow) return json(404, { error: 'Aanmelding niet gevonden' });
	if (reqRow.status !== 'pending') return json(409, { error: 'Aanmelding is al verwerkt' });

	// Find or create user by email
	let studentUserId: string | null = null;
	const { data: existingProfile } = await admin
		.from('profiles')
		.select('user_id')
		.eq('email', reqRow.email)
		.maybeSingle();

	if (existingProfile?.user_id) {
		studentUserId = existingProfile.user_id;
	} else {
		const { data: created, error: createErr } = await admin.auth.admin.createUser({
			email: reqRow.email,
			email_confirm: true,
			user_metadata: {
				first_name: reqRow.first_name,
				last_name: reqRow.last_name,
			},
		});
		if (createErr || !created.user) {
			console.error('createUser error', createErr);
			return json(500, { error: 'Kon gebruiker niet aanmaken' });
		}
		studentUserId = created.user.id;

		// Set phone on profile (handle_new_user trigger creates the profile row)
		if (reqRow.phone_number) {
			await admin.from('profiles').update({ phone_number: reqRow.phone_number }).eq('user_id', studentUserId);
		}
	}

	// Ensure student row exists with optional date_of_birth + parent info
	const { data: existingStudent } = await admin
		.from('students')
		.select('user_id')
		.eq('user_id', studentUserId)
		.maybeSingle();

	const studentPayload = {
		user_id: studentUserId,
		date_of_birth: reqRow.date_of_birth ?? null,
		parent_name: reqRow.parent_name ?? null,
		parent_email: reqRow.parent_email ?? null,
		parent_phone_number: reqRow.parent_phone_number ?? null,
	};
	if (existingStudent) {
		await admin
			.from('students')
			.update({
				date_of_birth: studentPayload.date_of_birth,
				parent_name: studentPayload.parent_name,
				parent_email: studentPayload.parent_email,
				parent_phone_number: studentPayload.parent_phone_number,
			})
			.eq('user_id', studentUserId);
	} else {
		await admin.from('students').insert(studentPayload);
	}

	// Ensure 'student' role exists (idempotent)
	await admin.from('user_roles').upsert({ user_id: studentUserId, role: 'student' }, { onConflict: 'user_id,role' });

	let createdAgreementId: string | null = null;

	const targetGroupId = body.override_lesson_group_id ?? reqRow.lesson_group_id;

	if (targetGroupId) {
		// Add to group; trigger creates the lesson_agreement
		const { error: memberErr } = await admin.from('lesson_group_members').insert({
			lesson_group_id: targetGroupId,
			student_user_id: studentUserId,
		});
		if (memberErr && !memberErr.message?.includes('duplicate')) {
			console.error('member insert error', memberErr);
			return json(500, { error: 'Kon leerling niet aan groep toevoegen' });
		}
		const { data: ag } = await admin
			.from('lesson_agreements')
			.select('id')
			.eq('lesson_group_id', targetGroupId)
			.eq('student_user_id', studentUserId)
			.eq('is_active', true)
			.maybeSingle();
		createdAgreementId = ag?.id ?? null;

		await admin
			.from('lesson_signup_requests')
			.update({
				status: 'approved',
				processed_by: user.id,
				processed_at: new Date().toISOString(),
				created_agreement_id: createdAgreementId,
				lesson_group_id: targetGroupId,
			})
			.eq('id', reqRow.id);
	}
	// For individual requests we DON'T mark approved here; staff completes via wizard
	// which will mark it approved on save (see AgreementWizard fromRequest handling).

	return json(200, {
		student_user_id: studentUserId,
		created_agreement_id: createdAgreementId,
		status: targetGroupId ? 'approved' : 'pending',
	});
});
