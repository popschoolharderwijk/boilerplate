// Verstuurt bevestigingsmails naar leerling en docent na aanmaken van een
// lesovereenkomst. Wordt aangeroepen vanuit de agreement-wizard nadat de
// insert in `lesson_agreements` is gelukt. Fouten worden bewust niet naar
// buiten geworpen: de overeenkomst is al opgeslagen, de UI toont hooguit
// een warning.

import { supabase } from '@/integrations/supabase/client';

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

function formatPrice(value: number | null | undefined): string {
	if (value === null || value === undefined) return '';
	return new Intl.NumberFormat('nl-NL', {
		style: 'currency',
		currency: 'EUR',
		minimumFractionDigits: 2,
	}).format(value);
}

function formatDate(iso: string | null | undefined): string {
	if (!iso) return '';
	// yyyy-mm-dd → dd-mm-yyyy
	const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
	if (!m) return iso;
	return `${m[3]}-${m[2]}-${m[1]}`;
}

function formatTime(time: string | null | undefined): string {
	if (!time) return '';
	return time.slice(0, 5);
}

export interface SendAgreementCreatedMailsResult {
	studentSent: boolean;
	teacherSent: boolean;
}

export async function sendAgreementCreatedMails(agreementId: string): Promise<SendAgreementCreatedMailsResult> {
	const result: SendAgreementCreatedMailsResult = { studentSent: false, teacherSent: false };

	const { data: agreement, error } = await supabase
		.from('lesson_agreements')
		.select(
			`id, day_of_week, start_time, start_date, frequency, price_per_lesson, payment_method,
			 student_user_id, teacher_user_id,
			 lesson_types(name)`,
		)
		.eq('id', agreementId)
		.maybeSingle();

	if (error || !agreement) {
		console.error('sendAgreementCreatedMails: overeenkomst niet gevonden', error);
		return result;
	}

	const [studentProfile, teacherProfile] = await Promise.all([
		supabase
			.from('profiles')
			.select('email, first_name, last_name')
			.eq('user_id', agreement.student_user_id)
			.maybeSingle(),
		supabase
			.from('profiles')
			.select('email, first_name, last_name')
			.eq('user_id', agreement.teacher_user_id)
			.maybeSingle(),
	]);

	const studentName =
		`${studentProfile.data?.first_name ?? ''} ${studentProfile.data?.last_name ?? ''}`.trim() || 'leerling';
	const teacherName =
		`${teacherProfile.data?.first_name ?? ''} ${teacherProfile.data?.last_name ?? ''}`.trim() || 'docent';
	const lessonType = Array.isArray(agreement.lesson_types)
		? agreement.lesson_types[0]?.name
		: (agreement.lesson_types as { name?: string } | null)?.name;

	const sharedVars = {
		leerling_naam: studentName,
		docent_naam: teacherName,
		les_type: lessonType ?? '',
		frequentie: FREQUENCY_LABELS[agreement.frequency] ?? agreement.frequency,
		prijs_per_les: formatPrice(agreement.price_per_lesson),
		dag: DAY_NAMES_NL[agreement.day_of_week] ?? '',
		tijd: formatTime(agreement.start_time),
		startdatum: formatDate(agreement.start_date),
		betaalmethode: PAYMENT_METHOD_LABELS[agreement.payment_method] ?? agreement.payment_method,
	};

	if (studentProfile.data?.email) {
		const { error: mailErr } = await supabase.functions.invoke('send-template-email', {
			body: {
				event_key: 'agreement_created',
				to: studentProfile.data.email.toLowerCase(),
				vars: sharedVars,
			},
		});
		if (mailErr) {
			console.error('agreement_created mail leerling', mailErr);
		} else {
			result.studentSent = true;
		}
	}

	if (teacherProfile.data?.email) {
		const { error: mailErr } = await supabase.functions.invoke('send-template-email', {
			body: {
				event_key: 'agreement_created_teacher',
				to: teacherProfile.data.email.toLowerCase(),
				vars: sharedVars,
			},
		});
		if (mailErr) {
			console.error('agreement_created_teacher mail docent', mailErr);
		} else {
			result.teacherSent = true;
		}
	}

	return result;
}
