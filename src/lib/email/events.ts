// Central registry of all event-driven email types.
// For each type we define the label, description, and available variables
// that can be used in subject and body via {{variable}} notation.
//
// Changes here must also be mirrored in `supabase/functions/_shared/email-events.ts`.

export interface EmailEventDefinition {
	key: string;
	label: string;
	description: string;
	variables: readonly string[];
	previewData: Record<string, string>;
}

const EMAIL_EVENTS = {
	signup_received: {
		key: 'signup_received',
		label: 'Bevestiging aanmelding',
		description: 'Verstuurd direct na het indienen van een aanmeldformulier op de publieke aanmeldpagina.',
		variables: ['leerling_naam', 'les_type', 'frequentie', 'prijs_per_les'],
		previewData: {
			leerling_naam: 'Sanne de Vries',
			les_type: 'Pianoles',
			frequentie: 'wekelijks',
			prijs_per_les: '€ 32,50',
		},
	},
	trial_scheduled: {
		key: 'trial_scheduled',
		label: 'Proefles ingepland (leerling)',
		description: 'Verstuurd naar de leerling (of ouder) wanneer een proefles is ingepland.',
		variables: ['leerling_naam', 'les_type', 'datum', 'tijd', 'duur'],
		previewData: {
			leerling_naam: 'Sanne de Vries',
			les_type: 'Pianoles',
			datum: '2026-06-03',
			tijd: '15:30',
			duur: '30',
		},
	},
	trial_scheduled_teacher: {
		key: 'trial_scheduled_teacher',
		label: 'Proefles ingepland (docent)',
		description: 'Verstuurd naar de docent wanneer er een proefles voor hem/haar is ingepland.',
		variables: ['docent_naam', 'leerling_naam', 'les_type', 'datum', 'tijd', 'duur'],
		previewData: {
			docent_naam: 'Jan Jansen',
			leerling_naam: 'Sanne de Vries',
			les_type: 'Pianoles',
			datum: '2026-06-03',
			tijd: '15:30',
			duur: '30',
		},
	},
} as const satisfies Record<string, EmailEventDefinition>;

export function listEmailEvents(): EmailEventDefinition[] {
	return Object.values(EMAIL_EVENTS);
}
