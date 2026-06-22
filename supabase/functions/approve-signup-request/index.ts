// Approve a lesson signup request (staff only).
// - Creates auth user + profile + student record (if no user exists yet for the email)
// - For group requests: inserts lesson_group_members (trigger auto-creates lesson_agreement)
// - For individual requests: marks request approved; staff completes via AgreementWizard
//   (wizard prefills using fromRequest=<id>)
// Marks the request as approved and links created_agreement_id when applicable.

import { beginAuthenticatedPostRequest, jsonResponse, UUID_RE } from '../_shared/http.ts';
import { createSupabaseClients, requireAdminUser } from '../_shared/supabase.ts';

interface Body {
	request_id: string;
	/** Optional: enroll the student in this group instead of the one originally requested. */
	override_lesson_group_id?: string | null;
}

Deno.serve(async (req) => {
	const begun = await beginAuthenticatedPostRequest<Body>(req);
	if (!begun.ok) return begun.response;
	const { authHeader, body } = begun;

	if (!body.request_id || !UUID_RE.test(body.request_id)) return jsonResponse(400, { error: 'Ongeldig request id' });
	if (body.override_lesson_group_id != null && !UUID_RE.test(body.override_lesson_group_id)) {
		return jsonResponse(400, { error: 'Ongeldig groep id' });
	}

	const { userClient, admin } = createSupabaseClients(authHeader);

	const authn = await requireAdminUser(userClient);
	if (!authn.ok) return authn.response;
	const { user } = authn;

	// Load request
	const { data: reqRow, error: reqErr } = await admin
		.from('lesson_signup_requests')
		.select('*')
		.eq('id', body.request_id)
		.single();
	if (reqErr || !reqRow) return jsonResponse(404, { error: 'Aanmelding niet gevonden' });
	if (reqRow.status !== 'pending' && reqRow.status !== 'trial_scheduled')
		return jsonResponse(409, { error: 'Aanmelding is al verwerkt' });

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
			return jsonResponse(500, { error: 'Kon gebruiker niet aanmaken' });
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

	// Auto-create SEPA mandate if bank details were provided in the signup request.
	if (reqRow.sepa_iban && reqRow.sepa_account_holder) {
		const { data: existingMandate } = await admin
			.from('sepa_mandates')
			.select('id')
			.eq('student_user_id', studentUserId)
			.eq('iban', reqRow.sepa_iban)
			.maybeSingle();
		if (!existingMandate) {
			const { data: refData, error: refErr } = await admin.rpc('next_mandate_reference');
			if (refErr || !refData) {
				console.error('next_mandate_reference error', refErr);
			} else {
				const { error: mandateErr } = await admin.from('sepa_mandates').insert({
					student_user_id: studentUserId,
					mandate_reference: refData as unknown as string,
					iban: reqRow.sepa_iban,
					bic: reqRow.sepa_bic,
					account_holder: reqRow.sepa_account_holder,
					signed_at: new Date().toISOString().slice(0, 10),
					signature_method: 'digital',
					status: 'pending',
					sequence_type: 'FRST',
				});
				if (mandateErr) console.error('sepa_mandates insert error', mandateErr);
			}
		}
	}


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
			return jsonResponse(500, { error: 'Kon leerling niet aan groep toevoegen' });
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

	return jsonResponse(200, {
		student_user_id: studentUserId,
		created_agreement_id: createdAgreementId,
		status: targetGroupId ? 'approved' : 'pending',
	});
});
