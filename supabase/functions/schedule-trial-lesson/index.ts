// Schedule a trial lesson (admin/staff only).
// - Optionally based on a lesson_signup_requests row (then student data is taken from there).
// - Otherwise pass student first_name/last_name/email + lesson_type_id explicitly.
// - Creates auth user + profile + student row when no user exists for the email.
// - Inserts trial_lessons row, agenda_events row (source_type='trial_lesson') and participants.
// - Marks the related signup request as 'trial_scheduled' when applicable.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { getSafeErrorMessage } from '../_shared/errors.ts';

interface Body {
	signup_request_id?: string | null;
	teacher_user_id: string;
	lesson_type_id?: string | null;
	lesson_type_option_id?: string | null;
	scheduled_date: string; // YYYY-MM-DD
	scheduled_start_time: string; // HH:MM(:SS)
	duration_minutes: number;
	notes?: string | null;
	// Required if no signup_request_id:
	student_email?: string;
	student_first_name?: string;
	student_last_name?: string;
	student_phone_number?: string | null;
	student_date_of_birth?: string | null;
	parent_name?: string | null;
	parent_email?: string | null;
	parent_phone_number?: string | null;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

	if (!body.teacher_user_id || !UUID_RE.test(body.teacher_user_id)) return json(400, { error: 'Ongeldige docent' });
	if (!body.scheduled_date || !/^\d{4}-\d{2}-\d{2}$/.test(body.scheduled_date))
		return json(400, { error: 'Ongeldige datum' });
	if (!body.scheduled_start_time || !/^\d{2}:\d{2}(:\d{2})?$/.test(body.scheduled_start_time))
		return json(400, { error: 'Ongeldige tijd' });
	if (!Number.isInteger(body.duration_minutes) || body.duration_minutes <= 0)
		return json(400, { error: 'Ongeldige duur' });
	if (body.signup_request_id && !UUID_RE.test(body.signup_request_id))
		return json(400, { error: 'Ongeldig request id' });
	if (body.lesson_type_id && !UUID_RE.test(body.lesson_type_id)) return json(400, { error: 'Ongeldige lessoort' });
	if (body.lesson_type_option_id && !UUID_RE.test(body.lesson_type_option_id))
		return json(400, { error: 'Ongeldige optie' });

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

	// Authn + authz
	const {
		data: { user },
		error: userErr,
	} = await userClient.auth.getUser();
	if (userErr || !user) return json(401, { error: 'Invalid token' });
	const { data: roleRow } = await userClient.from('user_roles').select('role').eq('user_id', user.id).single();
	const role = roleRow?.role;
	if (role !== 'admin' && role !== 'site_admin' && role !== 'staff') return json(403, { error: 'Geen rechten' });

	// Resolve student data either from signup request or from request body
	let studentEmail: string | null = null;
	let studentFirstName: string | null = null;
	let studentLastName: string | null = null;
	let studentPhone: string | null = null;
	let studentDob: string | null = null;
	let parentName: string | null = null;
	let parentEmail: string | null = null;
	let parentPhone: string | null = null;
	let lessonTypeId: string | null = body.lesson_type_id ?? null;
	let lessonTypeOptionId: string | null = body.lesson_type_option_id ?? null;
	let signupReq: { id: string; status: string } | null = null;

	if (body.signup_request_id) {
		const { data: req } = await admin
			.from('lesson_signup_requests')
			.select(
				'id, status, email, first_name, last_name, phone_number, date_of_birth, parent_name, parent_email, parent_phone_number, lesson_type_id, lesson_type_option_id',
			)
			.eq('id', body.signup_request_id)
			.maybeSingle();
		if (!req) return json(404, { error: 'Aanmelding niet gevonden' });
		if (req.status !== 'pending' && req.status !== 'trial_scheduled')
			return json(409, { error: 'Aanmelding is al verwerkt' });
		signupReq = { id: req.id, status: req.status };
		studentEmail = req.email;
		studentFirstName = req.first_name;
		studentLastName = req.last_name;
		studentPhone = req.phone_number ?? null;
		studentDob = req.date_of_birth ?? null;
		parentName = req.parent_name ?? null;
		parentEmail = req.parent_email ?? null;
		parentPhone = req.parent_phone_number ?? null;
		lessonTypeId = lessonTypeId ?? req.lesson_type_id;
		lessonTypeOptionId = lessonTypeOptionId ?? req.lesson_type_option_id ?? null;
	} else {
		studentEmail = body.student_email?.trim().toLowerCase() ?? null;
		studentFirstName = body.student_first_name?.trim() ?? null;
		studentLastName = body.student_last_name?.trim() ?? null;
		studentPhone = body.student_phone_number?.trim() || null;
		studentDob = body.student_date_of_birth || null;
		parentName = body.parent_name?.trim() || null;
		parentEmail = body.parent_email?.trim().toLowerCase() || null;
		parentPhone = body.parent_phone_number?.trim() || null;
	}

	if (!studentEmail || !EMAIL_RE.test(studentEmail)) return json(400, { error: 'Ongeldig e-mailadres' });
	if (!studentFirstName || !studentLastName) return json(400, { error: 'Naam is verplicht' });
	if (!lessonTypeId) return json(400, { error: 'Lessoort is verplicht' });

	try {
		// Find or create user
		let studentUserId: string;
		const { data: existingProfile } = await admin
			.from('profiles')
			.select('user_id')
			.eq('email', studentEmail)
			.maybeSingle();
		if (existingProfile?.user_id) {
			studentUserId = existingProfile.user_id;
		} else {
			const { data: created, error: createErr } = await admin.auth.admin.createUser({
				email: studentEmail,
				email_confirm: true,
				user_metadata: { first_name: studentFirstName, last_name: studentLastName },
			});
			if (createErr || !created.user) {
				console.error('createUser', createErr);
				return json(500, { error: 'Kon gebruiker niet aanmaken' });
			}
			studentUserId = created.user.id;
			if (studentPhone) {
				await admin.from('profiles').update({ phone_number: studentPhone }).eq('user_id', studentUserId);
			}
		}

		// Ensure student row
		const { data: existingStudent } = await admin
			.from('students')
			.select('user_id')
			.eq('user_id', studentUserId)
			.maybeSingle();
		const studentPayload = {
			date_of_birth: studentDob,
			parent_name: parentName,
			parent_email: parentEmail,
			parent_phone_number: parentPhone,
		};
		if (existingStudent) {
			await admin.from('students').update(studentPayload).eq('user_id', studentUserId);
		} else {
			await admin.from('students').insert({ user_id: studentUserId, ...studentPayload });
		}
		// Ensure 'student' role
		await admin
			.from('user_roles')
			.upsert({ user_id: studentUserId, role: 'student' }, { onConflict: 'user_id,role' });

		// Compute end_time from start + duration
		const [hh, mm] = body.scheduled_start_time.split(':').map(Number);
		const startTotal = hh * 60 + mm;
		const endTotal = startTotal + body.duration_minutes;
		const endTime = `${String(Math.floor(endTotal / 60)).padStart(2, '0')}:${String(endTotal % 60).padStart(2, '0')}`;

		// Insert trial_lessons row first (without agenda_event_id)
		const { data: trial, error: trialErr } = await admin
			.from('trial_lessons')
			.insert({
				signup_request_id: body.signup_request_id ?? null,
				student_user_id: studentUserId,
				teacher_user_id: body.teacher_user_id,
				lesson_type_id: lessonTypeId,
				lesson_type_option_id: lessonTypeOptionId,
				scheduled_date: body.scheduled_date,
				scheduled_start_time: body.scheduled_start_time,
				duration_minutes: body.duration_minutes,
				status: 'scheduled',
				notes: body.notes?.trim() || null,
			})
			.select('id')
			.single();
		if (trialErr || !trial) {
			console.error('trial insert', trialErr);
			return json(500, { error: 'Kon proefles niet aanmaken' });
		}

		// Lesson type info for title
		const { data: lt } = await admin
			.from('lesson_types')
			.select('name, color')
			.eq('id', lessonTypeId)
			.maybeSingle();

		// Insert agenda event (owner = teacher)
		const { data: ev, error: evErr } = await admin
			.from('agenda_events')
			.insert({
				title: `Proefles ${lt?.name ?? ''}`.trim(),
				description: `Proefles voor ${studentFirstName} ${studentLastName}`,
				owner_user_id: body.teacher_user_id,
				source_type: 'trial_lesson',
				source_id: trial.id,
				start_date: body.scheduled_date,
				start_time: body.scheduled_start_time,
				end_date: body.scheduled_date,
				end_time: endTime,
				is_all_day: false,
				recurring: false,
				color: lt?.color ?? null,
			})
			.select('id')
			.single();
		if (evErr || !ev) {
			console.error('agenda insert', evErr);
			await admin.from('trial_lessons').delete().eq('id', trial.id);
			return json(500, { error: 'Kon agenda-event niet aanmaken' });
		}

		// Participants: teacher + student
		await admin.from('agenda_participants').insert([
			{ event_id: ev.id, user_id: body.teacher_user_id },
			{ event_id: ev.id, user_id: studentUserId },
		]);

		// Backlink agenda_event_id on trial
		await admin.from('trial_lessons').update({ agenda_event_id: ev.id }).eq('id', trial.id);

		// Update signup status
		if (signupReq) {
			await admin.from('lesson_signup_requests').update({ status: 'trial_scheduled' }).eq('id', signupReq.id);
		}

		// Send mail to student (best-effort)
		try {
			const recipient = (parentEmail || studentEmail).toLowerCase();
			await fetch(`${supabaseUrl}/functions/v1/send-template-email`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${serviceKey}`,
				},
				body: JSON.stringify({
					event_key: 'trial_scheduled',
					to: recipient,
					vars: {
						leerling_naam: `${studentFirstName} ${studentLastName}`.trim(),
						les_type: lt?.name ?? '',
						datum: body.scheduled_date,
						tijd: body.scheduled_start_time.slice(0, 5),
						duur: String(body.duration_minutes),
					},
				}),
			});
		} catch (mailErr) {
			console.error('trial_scheduled mail', mailErr);
		}

		return json(200, {
			trial_id: trial.id,
			student_user_id: studentUserId,
			agenda_event_id: ev.id,
		});
	} catch (err) {
		console.error('schedule-trial-lesson error', err);
		return json(500, { error: getSafeErrorMessage(err, 'Onverwachte fout') });
	}
});
