/** Map agenda event save failures to Dutch UI messages. */
export function formatAgendaEventSaveError(err: unknown): string {
	const message = 'Opslaan mislukt';
	const errMessage = err instanceof Error ? err.message : (err as { message?: string })?.message;
	if (errMessage === 'NO_CHANGES') return 'Er zijn geen wijzigingen om op te slaan.';
	if (!errMessage) return message;
	if (errMessage.includes('row-level security')) return 'Je hebt geen toestemming om deze deelnemer toe te voegen';
	return errMessage;
}
