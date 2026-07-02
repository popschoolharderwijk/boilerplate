// Creates two linked duo agreements (lesson_agreements) in a single transaction.
// Both agreements share the same duo_pair_id, the same time slot with the same teacher,
// and the same lesson type (which must have the is_duo_lesson flag). On failure, the first
// row is deleted so we do not end up in a half-finished state.
//
// Auth required. Toegestaan: admin, site_admin, teacher (staff).
import { getSafeErrorMessage } from '../_shared/errors.ts';
import { beginAuthenticatedPostRequest, jsonResponse, UUID_RE } from '../_shared/http.ts';
import { requireAuthenticatedClients, requireUserRole } from '../_shared/supabase.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const DAY_NAMES_NL = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];
const FREQUENCY_LABELS: Record<string, string> = {
	weekly: 'wekelijks',
	biweekly: 'om de week',
	monthly: 'maandelijks',
};
const PAYMENT_METHOD_LABELS: Record<string, string> = {
	stripe: 'Automatische incasso via Stripe',
	sepa: 'SEPA-incasso',
	manual: 'Handmatige facturatie',
};

function formatPrice(value: number): string {
	return new Intl.NumberFormat('nl-NL', {
		style: 'currency',
		currency: 'EUR',
		minimumFractionDigits: 2,
	}).format(value);
}

function formatDate(iso: string): string {
	const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
	return m ? `${m[3]}-${m[2]}-${m[1]}` : iso;
}


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

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const VALID_FREQUENCIES = new Set(['weekly', 'biweekly', 'monthly']);

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
	const begun = await beginAuthenticatedPostRequest<unknown>(req);
	if (!begun.ok) return begun.response;
	const { authHeader, body: raw } = begun;

	const parsed = validate(raw);
	if (!parsed.ok) return jsonResponse(400, { error: parsed.error });
	const body = parsed.value;

	const auth = await requireAuthenticatedClients(authHeader);
	if (!auth.ok) return auth.response;
	const { userClient, admin, user } = auth;

	const denied = await requireUserRole(userClient, user.id, ['admin', 'site_admin', 'teacher']);
	if (denied) return denied;

	// Verify that the lesson type is actually a duo lesson type.
	const { data: lessonType, error: ltErr } = await admin
		.from('lesson_types')
		.select('id, is_duo_lesson, is_group_lesson, is_active')
		.eq('id', body.lesson_type_id)
		.maybeSingle();
	if (ltErr || !lessonType) return jsonResponse(404, { error: 'Lessoort niet gevonden' });
	if (!lessonType.is_duo_lesson) return jsonResponse(422, { error: 'Lessoort is geen duo-lestype' });
	if (lessonType.is_group_lesson) return jsonResponse(422, { error: 'Lessoort is een groepsles, niet duo' });
	if (!lessonType.is_active) return jsonResponse(422, { error: 'Lessoort is niet actief' });

	// Generate duo_pair_id and create both agreements.
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

	// Insert agreement A first (validates that slot/lesson type are OK).
	const { data: rowA, error: errA } = await admin
		.from('lesson_agreements')
		.insert({ ...basePayload, student_user_id: body.student_user_id_a })
		.select('id')
		.single();
	if (errA || !rowA) {
		console.error('Duo create A failed', errA);
		return jsonResponse(400, { error: getSafeErrorMessage(errA ?? new Error('Aanmaken overeenkomst A mislukt')) });
	}

	// Insert agreement B. Trigger validates slot match and max 2 members.
	const { data: rowB, error: errB } = await admin
		.from('lesson_agreements')
		.insert({ ...basePayload, student_user_id: body.student_user_id_b })
		.select('id')
		.single();
	if (errB || !rowB) {
		console.error('Duo create B failed, rolling back A', errB);
		// Rollback: delete first row so we do not leave a half-finished duo behind.
		await admin.from('lesson_agreements').delete().eq('id', rowA.id);
		return jsonResponse(400, { error: getSafeErrorMessage(errB ?? new Error('Aanmaken overeenkomst B mislukt')) });
	}

	return jsonResponse(200, {
		ok: true,
		duo_pair_id: duoPairId,
		agreement_ids: [rowA.id, rowB.id],
	});
});
