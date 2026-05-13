// Edge function spiegel van src/lib/email/events.ts.
// Houd beide bestanden gelijk wanneer je een event toevoegt.

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
};

export function getEmailEvent(key: string): EmailEventDefinition | null {
	return EMAIL_EVENTS[key] ?? null;
}
