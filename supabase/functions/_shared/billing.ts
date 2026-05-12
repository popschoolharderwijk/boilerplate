// Shared billing helpers for Stripe subscription schedules.
// Reimplements the client-side billing logic in Deno (no @/ imports possible).

import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type Stripe from 'https://esm.sh/stripe@17.5.0?target=deno';

export type LessonFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly';

export const BILLING_MONTHS_PER_YEAR = 11;
const NON_BILLING_MONTH_INDEX = 7; // August (0-based)

function pad(n: number): string {
	return n.toString().padStart(2, '0');
}

function ymd(d: Date): string {
	return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

export interface SchoolYearWindow {
	start: string;
	end: string;
	startYear: number;
}

export function getSchoolYearForDateString(dateStr: string): SchoolYearWindow {
	const d = new Date(`${dateStr}T12:00:00Z`);
	const year = d.getUTCFullYear();
	const month = d.getUTCMonth();
	const startYear = month >= 8 || month === NON_BILLING_MONTH_INDEX ? year : year - 1;
	return { startYear, start: `${startYear}-09-01`, end: `${startYear + 1}-07-31` };
}

export function clampToSchoolYear(
	sy: SchoolYearWindow,
	agreementStart: string,
	agreementEnd: string | null,
): { start: string; end: string } | null {
	const start = agreementStart > sy.start ? agreementStart : sy.start;
	const end = agreementEnd && agreementEnd < sy.end ? agreementEnd : sy.end;
	if (start > end) return null;
	return { start, end };
}

/** Step a date by one frequency interval (UTC, mutates). */
function addInterval(d: Date, f: LessonFrequency): void {
	if (f === 'daily') d.setUTCDate(d.getUTCDate() + 1);
	else if (f === 'weekly') d.setUTCDate(d.getUTCDate() + 7);
	else if (f === 'biweekly') d.setUTCDate(d.getUTCDate() + 14);
	else {
		const day = d.getUTCDate();
		d.setUTCMonth(d.getUTCMonth() + 1);
		const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
		d.setUTCDate(Math.min(day, last));
	}
}

/** Generate occurrence YYYY-MM-DD strings for the given pattern in [start,end]. */
export function getOccurrenceDates(
	dayOfWeek: number,
	startStr: string,
	endStr: string,
	frequency: LessonFrequency,
): string[] {
	const start = new Date(`${startStr}T12:00:00Z`);
	const end = new Date(`${endStr}T12:00:00Z`);
	const cur = new Date(start);
	if (frequency === 'weekly' || frequency === 'biweekly') {
		const diff = (dayOfWeek - cur.getUTCDay() + 7) % 7;
		cur.setUTCDate(cur.getUTCDate() + diff);
	} else if (frequency === 'monthly') {
		// keep cur on first occurrence on/after start
	}
	const out: string[] = [];
	while (cur <= end) {
		out.push(ymd(cur));
		addInterval(cur, frequency);
	}
	return out;
}

export interface NoLessonPeriod {
	start_date: string;
	end_date: string;
}

function isInNoLessonPeriod(date: string, periods: ReadonlyArray<NoLessonPeriod>): boolean {
	for (const p of periods) {
		if (date >= p.start_date && date <= p.end_date) return true;
	}
	return false;
}

function isAugust(dateStr: string): boolean {
	return dateStr.slice(5, 7) === '08';
}

export interface YearlyResult {
	lessonsCount: number;
	yearlyCents: number;
	monthlyCents: number;
	leftoverCents: number;
	lessonDates: string[];
}

export function calculateYearly(input: {
	periodStart: string;
	periodEnd: string;
	dayOfWeek: number;
	frequency: LessonFrequency;
	pricePerLessonCents: number;
	noLessonPeriods: ReadonlyArray<NoLessonPeriod>;
}): YearlyResult {
	const all = getOccurrenceDates(input.dayOfWeek, input.periodStart, input.periodEnd, input.frequency);
	const lessonDates = all.filter((d) => !isAugust(d) && !isInNoLessonPeriod(d, input.noLessonPeriods));
	const lessonsCount = lessonDates.length;
	const yearlyCents = lessonsCount * input.pricePerLessonCents;
	const monthlyCents = Math.floor(yearlyCents / BILLING_MONTHS_PER_YEAR);
	const leftoverCents = yearlyCents - monthlyCents * BILLING_MONTHS_PER_YEAR;
	return { lessonsCount, yearlyCents, monthlyCents, leftoverCents, lessonDates };
}

export type AgeTariff = 'under_21' | 'adult';

export function pickAgeTariff(dob: string | null | undefined, onDate: string): AgeTariff {
	if (!dob) return 'adult';
	const ref = new Date(`${onDate}T12:00:00Z`);
	const birth = new Date(`${dob}T12:00:00Z`);
	const twentyFirst = new Date(birth);
	twentyFirst.setUTCFullYear(twentyFirst.getUTCFullYear() + 21);
	return ref >= twentyFirst ? 'adult' : 'under_21';
}

// ---------------- Schedule builder ----------------

export interface ScheduleContext {
	lessonAgreementId: string;
	customerId: string;
	defaultPaymentMethod?: string;
}

export interface BuiltSchedule {
	scheduleId: string;
	subscriptionId: string | null;
	yearly: YearlyResult;
	tariff: AgeTariff;
	pricePerLessonCents: number;
	periodStart: string;
	periodEnd: string;
}

interface Phase {
	startUnix: number;
	endUnix: number;
	amountCents: number;
	label: string;
}

/** Build the 11 monthly phases for a school year, with leftover on the last (July) phase. */
function buildPhases(periodStart: string, periodEnd: string, monthlyCents: number, leftoverCents: number): Phase[] {
	const phases: Phase[] = [];
	const start = new Date(`${periodStart}T00:00:00Z`);
	const end = new Date(`${periodEnd}T00:00:00Z`);
	// Walk first day of each month from periodStart's month to periodEnd's month
	let cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
	const months: Date[] = [];
	while (cursor <= end) {
		const m = cursor.getUTCMonth();
		if (m !== NON_BILLING_MONTH_INDEX) months.push(new Date(cursor));
		cursor = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1));
	}
	for (let i = 0; i < months.length; i++) {
		const m = months[i];
		const next =
			i + 1 < months.length ? months[i + 1] : new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() + 1, 1));
		const phaseStart = i === 0 ? start : m; // first phase begins at the agreement start (may be mid-month)
		const startUnix = Math.floor(phaseStart.getTime() / 1000);
		const endUnix = Math.floor(next.getTime() / 1000);
		const isLast = i === months.length - 1;
		phases.push({
			startUnix,
			endUnix,
			amountCents: monthlyCents + (isLast ? leftoverCents : 0),
			label: `${m.getUTCFullYear()}-${pad(m.getUTCMonth() + 1)}`,
		});
	}
	return phases;
}

/** Create a Stripe Subscription Schedule with one phase per billing month. */
export async function createScheduleForAgreement(
	admin: SupabaseClient,
	stripe: Stripe,
	ctx: ScheduleContext,
): Promise<BuiltSchedule> {
	// 1) Load agreement with all needed fields
	const { data: ag, error: agErr } = await admin
		.from('lesson_agreements')
		.select(
			'id, student_user_id, lesson_type_id, frequency, duration_minutes, day_of_week, start_date, end_date, is_active',
		)
		.eq('id', ctx.lessonAgreementId)
		.maybeSingle();
	if (agErr || !ag) throw new Error('Lesovereenkomst niet gevonden');
	if (!ag.is_active) throw new Error('Lesovereenkomst is niet actief');

	// 2) Load price option, student dob, no_lesson_periods
	const [{ data: option, error: optErr }, { data: student }, { data: noPeriods }] = await Promise.all([
		admin
			.from('lesson_type_options')
			.select('price_per_lesson_under_21_cents, price_per_lesson_adult_cents')
			.eq('lesson_type_id', ag.lesson_type_id)
			.eq('frequency', ag.frequency)
			.eq('duration_minutes', ag.duration_minutes)
			.maybeSingle(),
		admin.from('students').select('date_of_birth').eq('user_id', ag.student_user_id).maybeSingle(),
		admin.from('no_lesson_periods').select('start_date, end_date'),
	]);
	if (optErr) throw new Error(`Kon prijsopties niet laden: ${optErr.message}`);
	if (!option) throw new Error('Geen prijs ingesteld voor deze duur/frequentie.');

	// 3) Compute window + tariff + yearly
	const today = new Date().toISOString().slice(0, 10);
	const ref = ag.start_date > today ? ag.start_date : today;
	const sy = getSchoolYearForDateString(ref);
	const win = clampToSchoolYear(sy, ag.start_date, ag.end_date);
	if (!win) throw new Error('Geen lesperiode binnen het huidige schooljaar.');

	const tariff = pickAgeTariff(student?.date_of_birth ?? null, win.start);
	const pricePerLessonCents =
		tariff === 'under_21' ? option.price_per_lesson_under_21_cents : option.price_per_lesson_adult_cents;
	if (!pricePerLessonCents || pricePerLessonCents <= 0) {
		throw new Error(`Geen prijs ingesteld voor tarief ${tariff}.`);
	}

	const yearly = calculateYearly({
		periodStart: win.start,
		periodEnd: win.end,
		dayOfWeek: ag.day_of_week,
		frequency: ag.frequency as LessonFrequency,
		pricePerLessonCents,
		noLessonPeriods: noPeriods ?? [],
	});

	if (yearly.yearlyCents <= 0) throw new Error('Geen lessen in dit schooljaar; geen incasso aangemaakt.');

	// 4) Build phases and the schedule
	const phases = buildPhases(win.start, win.end, yearly.monthlyCents, yearly.leftoverCents);
	if (phases.length === 0) throw new Error('Geen incassomaanden te plannen.');

	const stripePhases = phases.map((p) => ({
		items: [
			{
				price_data: {
					currency: 'eur',
					product_data: { name: `Lesgeld ${p.label}` },
					unit_amount: p.amountCents,
					recurring: { interval: 'month' as const, interval_count: 1 },
				},
				quantity: 1,
			},
		],
		iterations: 1,
		proration_behavior: 'none' as const,
		collection_method: 'charge_automatically' as const,
		metadata: { phase_label: p.label, lesson_agreement_id: ctx.lessonAgreementId },
		...(ctx.defaultPaymentMethod ? { default_payment_method: ctx.defaultPaymentMethod } : {}),
	}));

	const schedule = await stripe.subscriptionSchedules.create({
		customer: ctx.customerId,
		start_date: phases[0].startUnix,
		end_behavior: 'release',
		phases: stripePhases,
		metadata: {
			lesson_agreement_id: ctx.lessonAgreementId,
			school_year: `${sy.startYear}/${sy.startYear + 1}`,
		},
	});

	const subscriptionId =
		typeof schedule.subscription === 'string' ? schedule.subscription : (schedule.subscription?.id ?? null);

	// 5) Persist schedule_id on lesson_agreements (subscription row is upserted by webhook)
	await admin.from('lesson_agreements').update({ stripe_schedule_id: schedule.id }).eq('id', ctx.lessonAgreementId);
	if (subscriptionId) {
		await admin
			.from('subscriptions')
			.update({ stripe_schedule_id: schedule.id })
			.eq('stripe_subscription_id', subscriptionId);
	}

	return {
		scheduleId: schedule.id,
		subscriptionId,
		yearly,
		tariff,
		pricePerLessonCents,
		periodStart: win.start,
		periodEnd: win.end,
	};
}
