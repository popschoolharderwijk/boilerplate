export function getStudentFormDialogCopy(isEditMode: boolean, firstName: string, email: string) {
	return {
		dialogTitle: isEditMode ? 'Leerling bewerken' : 'Nieuwe leerling toevoegen',
		dialogDescription: isEditMode
			? `Wijzig de gegevens van ${firstName || email}.`
			: 'Voeg een nieuwe leerling toe aan het systeem.',
		submitLabel: isEditMode ? 'Opslaan' : 'Toevoegen',
		savingLabel: isEditMode ? 'Opslaan...' : 'Toevoegen...',
	};
}
