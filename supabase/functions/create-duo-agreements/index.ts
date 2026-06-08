// Maakt twee gekoppelde duo-overeenkomsten (lesson_agreements) aan in één transactie.
// Beide overeenkomsten krijgen dezelfde duo_pair_id, hetzelfde tijdslot bij dezelfde docent
// en dezelfde lessoort (die de is_duo_lesson vlag moet hebben). Bij faal wordt de eerste
// rij weer verwijderd zodat we niet in een halve-staat eindigen.
//
// Auth required. Toegestaan: admin, site_admin, teacher (staff).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { getSafeErrorMessage } from '../_shared/errors.ts';

interface Body {
	student_user_id_a: string;
	student_user_id_b: string;
	teacher_user_id: string;
	lesson_type_id: string;
	day_of_week: number;
	start_time: string;
	duration_minutes: number;
	frequency: 'weekly' | 'biweekly' | 'monthly';
	price_per_lesson: number;
	start_date: string;
	end_date: string | null;
	signup_source?: string | null;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const VALID_FREQUENCIES = new Set(['weekly', 'biweekly', 'monthly']);

function json(status: number, payload: unknown) {
	return new Response(JSON.stringify(payload), {
		status,
		headers: { ...corsHeaders, 'Content-Type': 'application/json' },
	});
}

function validate(body: unknown): { ok: true; value: Body } | { ok: false; error: string } {
	if (typeof body !== 'object' || body === null) return { ok: false, error: 'Body moet een object zijn' };
	const b = body as Record<string, unknown>;
	const required = [
		'student_user_id_a',
		'student_user_id_b',
		'teacher_user_id',
		'lesson_type_id',
		'day_of_week',
		'start_time',
		'duration_minutes',
		'frequency',
		'price_per_lesson',
		'start_date',
	];
	for (const k of required) {
		if (b[k] === undefined || b[k] === null) return { ok: false, error: `Veld '${k}' is verplicht` };
	}
	for (const k of ['student_user_id_a', 'student_user_id_b', 'teacher_user_id', 'lesson_type_id']) {
		if (typeof b[k] !== 'string' || !UUID_RE.test(b[k] as string)) {
			return { ok: false, error: `'${k}' moet een geldige UUID zijn` };
		}
	}
	if (b.student_user_id_a === b.student_user_id_b) {
		return { ok: false, error: 'Duo-leerlingen moeten verschillend zijn' };
	}
	const dow = b.day_of_week;
	if (typeof dow !== 'number' || dow < 0 || dow > 6 || !Number.isInteger(dow)) {
		return { ok: false, error: "'day_of_week' moet een geheel getal 0-6 zijn" };
	}
	if (typeof b.start_time !== 'string' || !TIME_RE.test(b.start_time)) {
		return { ok: false, error: "'start_time' moet HH:MM(:SS) formaat hebben" };
	}
	if (typeof b.duration_minutes !== 'number' || b.duration_minutes <= 0) {
		return { ok: false, error: "'duration_minutes' moet positief zijn" };
	}
	if (typeof b.frequency !== 'string' || !VALID_FREQUENCIES.has(b.frequency)) {
		return { ok: false, error: "'frequency' moet weekly, biweekly of monthly zijn" };
	}
	if (typeof b.price_per_lesson !== 'number' || b.price_per_lesson < 0) {
		return { ok: false, error: "'price_per_lesson' moet >= 0 zijn" };
	}
	if (typeof b.start_date !== 'string' || !DATE_RE.test(b.start_date)) {
		return { ok: false, error: "'start_date' moet YYYY-MM-DD formaat hebben" };
	}
	if (
		b.end_date !== null &&
		b.end_date !== undefined &&
		(typeof b.end_date !== 'string' || !DATE_RE.test(b.end_date))
	) {
		return { ok: false, error: "'end_date' moet YYYY-MM-DD formaat hebben of null zijn" };
	}
	return {
		ok: true,
		value: {
			student_user_id_a: b.student_user_id_a as string,
			student_user_id_b: b.student_user_id_b as string,
			teacher_user_id: b.teacher_user_id as string,
			lesson_type_id: b.lesson_type_id as string,
			day_of_week: dow,
			start_time: b.start_time as string,
			duration_minutes: b.duration_minutes as number,
			frequency: b.frequency as Body['frequency'],
			price_per_lesson: b.price_per_lesson as number,
			start_date: b.start_date as string,
			end_date: (b.end_date as string | null | undefined) ?? null,
			signup_source: typeof b.signup_source === 'string' ? (b.signup_source as string) : 'staff_duo',
		},
	};
}

Deno.serve(async (req) => {
	if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });
	if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });

	const authHeader = req.headers.get('Authorization');
	if (!authHeader) return json(401, { error: 'Missing authorization header' });

	let raw: unknown;
	try {
		raw = await req.json();
	} catch {
		return json(400, { error: 'Invalid JSON' });
	}
	const parsed = validate(raw);
	if (!parsed.ok) return json(400, { error: parsed.error });
	const body = parsed.value;

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

	const {
		data: { user },
		error: userErr,
	} = await userClient.auth.getUser();
	if (userErr || !user) return json(401, { error: 'Invalid token' });

	// Authz: alleen staff (admin/site_admin/teacher) mag duo-overeenkomsten aanmaken.
	const { data: roleRow } = await userClient.from('user_roles').select('role').eq('user_id', user.id).single();
	const role = roleRow?.role;
	if (role !== 'admin' && role !== 'site_admin' && role !== 'teacher') {
		return json(403, { error: 'Geen rechten' });
	}

	// Controleer dat lessoort daadwerkelijk een duo-lestype is.
	const { data: lessonType, error: ltErr } = await admin
		.from('lesson_types')
		.select('id, is_duo_lesson, is_group_lesson, is_active')
		.eq('id', body.lesson_type_id)
		.maybeSingle();
	if (ltErr || !lessonType) return json(404, { error: 'Lessoort niet gevonden' });
	if (!lessonType.is_duo_lesson) return json(422, { error: 'Lessoort is geen duo-lestype' });
	if (lessonType.is_group_lesson) return json(422, { error: 'Lessoort is een groepsles, niet duo' });
	if (!lessonType.is_active) return json(422, { error: 'Lessoort is niet actief' });

	// Genereer duo_pair_id en maak beide overeenkomsten aan.
	const duoPairId = crypto.randomUUID();
	const basePayload = {
		teacher_user_id: body.teacher_user_id,
		lesson_type_id: body.lesson_type_id,
		day_of_week: body.day_of_week,
		start_time: body.start_time,
		duration_minutes: body.duration_minutes,
		frequency: body.frequency,
		price_per_lesson: body.price_per_lesson,
		start_date: body.start_date,
		end_date: body.end_date,
		is_active: true,
		duo_pair_id: duoPairId,
		signup_source: body.signup_source ?? 'staff_duo',
	};

	// Insert overeenkomst A (eerst, valideert dat slot/lestype OK is).
	const { data: rowA, error: errA } = await admin
		.from('lesson_agreements')
		.insert({ ...basePayload, student_user_id: body.student_user_id_a })
		.select('id')
		.single();
	if (errA || !rowA) {
		console.error('Duo create A failed', errA);
		return json(400, { error: getSafeErrorMessage(errA ?? new Error('Aanmaken overeenkomst A mislukt')) });
	}

	// Insert overeenkomst B. Trigger valideert slot-match en max-2-leden.
	const { data: rowB, error: errB } = await admin
		.from('lesson_agreements')
		.insert({ ...basePayload, student_user_id: body.student_user_id_b })
		.select('id')
		.single();
	if (errB || !rowB) {
		console.error('Duo create B failed, rolling back A', errB);
		// Rollback: verwijder eerste rij zodat we geen halve duo achterlaten.
		await admin.from('lesson_agreements').delete().eq('id', rowA.id);
		return json(400, { error: getSafeErrorMessage(errB ?? new Error('Aanmaken overeenkomst B mislukt')) });
	}

	return json(200, {
		ok: true,
		duo_pair_id: duoPairId,
		agreement_ids: [rowA.id, rowB.id],
	});
});
