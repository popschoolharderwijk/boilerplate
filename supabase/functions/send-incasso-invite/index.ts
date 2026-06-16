// Sends a Magic Link to the student (or their representative)
// with a redirect to /incasso/start?agreement=<id>. After logging in,
// the user can proceed directly to Stripe checkout.
//
// Auth required. Allowed: privileged staff (admin/teacher) or the student themselves.
// For a minor student (date_of_birth -> <18 now), the email is sent to
// `parent_email` if present, otherwise to the student account.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { handleCorsPreflight, jsonResponse, requirePost } from '../_shared/http.ts';
import { getSafeErrorMessage } from '../_shared/stripe.ts';

interface Body {
	lesson_agreement_id: string;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FALLBACK_SITE_URL = 'https://mcp.mplifi.nl';
const ALLOWED_SITE_HOSTS = new Set([
	'mcp.mplifi.nl',
	'instant-setup-kit.lovable.app',
	'id-preview--098d4be4-b790-4fca-9806-d5dd653b8946.lovable.app',
	'098d4be4-b790-4fca-9806-d5dd653b8946.lovableproject.com',
]);

function getRedirectBaseUrl(req: Request) {
	const candidates = [req.headers.get('Origin'), Deno.env.get('SITE_URL'), FALLBACK_SITE_URL];

	for (const candidate of candidates) {
		if (!candidate) continue;
		try {
			const url = new URL(candidate);
			if (url.protocol === 'https:' && ALLOWED_SITE_HOSTS.has(url.hostname)) {
				return url.origin;
			}
		} catch {
			// Ignore invalid environment/header values and continue with the next candidate.
		}
	}

	return FALLBACK_SITE_URL;
}

Deno.serve(async (req) => {
	const preflight = handleCorsPreflight(req);
	if (preflight) return preflight;
	const notPost = requirePost(req);
	if (notPost) return notPost;

	const authHeader = req.headers.get('Authorization');
	if (!authHeader) return jsonResponse(401, { error: 'Missing authorization header' });

	let body: Body;
	try {
		body = await req.json();
	} catch {
		return jsonResponse(400, { error: 'Invalid JSON' });
	}
	if (!body.lesson_agreement_id || !UUID_RE.test(body.lesson_agreement_id)) {
		return jsonResponse(400, { error: 'Ongeldig lesson_agreement_id' });
	}

	const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
	const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
	const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
	const siteUrl = getRedirectBaseUrl(req);

	const userClient = createClient(supabaseUrl, anonKey, {
		global: { headers: { Authorization: authHeader } },
		auth: { autoRefreshToken: false, persistSession: false },
	});
	const admin = createClient(supabaseUrl, serviceKey, {
		auth: { autoRefreshToken: false, persistSession: false },
	});

	const {
		data: { user },
		error: userErr,
	} = await userClient.auth.getUser();
	if (userErr || !user) return jsonResponse(401, { error: 'Invalid token' });

	// Authz: privileged or the student themselves
	const { data: roleRow } = await userClient.from('user_roles').select('role').eq('user_id', user.id).single();
	const role = roleRow?.role;
	const isPrivileged = role === 'admin' || role === 'site_admin' || role === 'teacher';

	const { data: agreement, error: agErr } = await admin
		.from('lesson_agreements')
		.select('id, student_user_id, is_active')
		.eq('id', body.lesson_agreement_id)
		.maybeSingle();
	if (agErr || !agreement) return jsonResponse(404, { error: 'Overeenkomst niet gevonden' });
	if (!agreement.is_active) return jsonResponse(409, { error: 'Overeenkomst is niet actief' });
	if (!isPrivileged && agreement.student_user_id !== user.id) {
		return jsonResponse(403, { error: 'Geen rechten' });
	}

	// Email address = the student's account email. This is guaranteed to be
	// an existing Supabase auth account (otherwise the Magic Link cannot work).
	// For minor students, parents typically completed signup using
	// their own email address, so this address already reaches the representative.
	const { data: profile } = await admin
		.from('profiles')
		.select('email')
		.eq('user_id', agreement.student_user_id)
		.maybeSingle();
	const recipient = profile?.email ?? null;
	if (!recipient) return jsonResponse(422, { error: 'Geen e-mailadres bekend voor leerling' });

	const redirectTo = `${siteUrl}/incasso/start?agreement=${agreement.id}`;

	// Send magic link via Supabase Auth (uses configured SMTP).
	// shouldCreateUser=false: only the existing student can log in via this link;
	// a parent receives the email but logs in as the student account owner.
	const otpClient = createClient(supabaseUrl, anonKey, {
		auth: { autoRefreshToken: false, persistSession: false },
	});
	const { error: otpErr } = await otpClient.auth.signInWithOtp({
		email: recipient,
		options: {
			emailRedirectTo: redirectTo,
			shouldCreateUser: false,
		},
	});
	if (otpErr) {
		console.error('signInWithOtp error', otpErr);
		return jsonResponse(502, { error: getSafeErrorMessage(otpErr) });
	}

	await admin.from('incasso_invitations').insert({
		lesson_agreement_id: agreement.id,
		recipient_email: recipient,
		sent_by: user.id,
	});

	return jsonResponse(200, { ok: true, recipient });
});
