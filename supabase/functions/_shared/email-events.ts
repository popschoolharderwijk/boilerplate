// Edge function mirror of src/lib/email/events.ts.
// Keep both files in sync when adding an event.

export interface EmailEventDefinition {
	key: string;
	label: string;
	description: string;
	variables: readonly string[];
}

export const EMAIL_EVENTS: Record<string, EmailEventDefinition> = {
	signup_received: {
		key: 'signup_received',
		label: 'Bevestiging aanmelding',
		description: 'Verstuurd direct na het indienen van een aanmeldformulier.',
		variables: ['leerling_naam', 'les_type', 'frequentie', 'prijs_per_les'],
	},
	trial_scheduled: {
		key: 'trial_scheduled',
		label: 'Proefles ingepland (leerling)',
		description: 'Verstuurd naar de leerling wanneer een proefles is ingepland.',
		variables: ['leerling_naam', 'les_type', 'datum', 'tijd', 'duur'],
	},
	trial_scheduled_teacher: {
		key: 'trial_scheduled_teacher',
		label: 'Proefles ingepland (docent)',
		description: 'Verstuurd naar de docent wanneer er een proefles is ingepland.',
		variables: ['docent_naam', 'leerling_naam', 'les_type', 'datum', 'tijd', 'duur'],
	},
};

export function getEmailEvent(key: string): EmailEventDefinition | null {
	return EMAIL_EVENTS[key] ?? null;
}
