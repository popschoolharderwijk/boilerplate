// Centrale registry van alle event-gestuurde mail-types.
// Voor elk type definiëren we de label, beschrijving en beschikbare variabelen
// die in onderwerp en body kunnen worden gebruikt via {{variabele}}-notatie.
//
// Wijzigingen hier moeten ook in `supabase/functions/_shared/email-events.ts` worden gespiegeld.

export interface EmailEventDefinition {
	key: string;
	label: string;
	description: string;
	variables: readonly string[];
	previewData: Record<string, string>;
}

export const EMAIL_EVENTS = {
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
} as const satisfies Record<string, EmailEventDefinition>;

export type EmailEventKey = keyof typeof EMAIL_EVENTS;

export function getEmailEvent(key: string): EmailEventDefinition | null {
	return (EMAIL_EVENTS as Record<string, EmailEventDefinition>)[key] ?? null;
}

export function listEmailEvents(): EmailEventDefinition[] {
	return Object.values(EMAIL_EVENTS);
}
