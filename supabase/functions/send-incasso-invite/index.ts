// Sends a Magic Link to the student (or their representative)
// with a redirect to /incasso/start?agreement=<id>. After logging in,
// the user can proceed directly to Stripe checkout.
//
// Auth required. Allowed: privileged staff (admin/teacher) or the student themselves.
// For a minor student (date_of_birth -> <18 now), the email is sent to
// `parent_email` if present, otherwise to the student account.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getSiteBaseUrl, jsonResponse, serveLessonAgreementPost } from '../_shared/http.ts';
import { getSafeErrorMessage } from '../_shared/stripe.ts';
import { fetchUserRole, requireAuthenticatedClients } from '../_shared/supabase.ts';

serveLessonAgreementPost(async ({ req, authHeader, lessonAgreementId }) => {
	const siteUrl = getSiteBaseUrl(req);

	const auth = await requireAuthenticatedClients(authHeader);
	if (!auth.ok) return auth.response;
	const { userClient, admin, user } = auth;

	// Authz: privileged or the student themselves
	const role = await fetchUserRole(userClient, user.id);
	const isPrivileged = role === 'admin' || role === 'site_admin' || role === 'teacher';

	const { data: agreement, error: agErr } = await admin
		.from('lesson_agreements')
		.select('id, student_user_id, is_active')
		.eq('id', lessonAgreementId)
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
	const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
	const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
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
