export function getConfirmStepHeading(hasChanges: boolean): string {
	return hasChanges ? 'Controleer je wijzigingen' : 'Overzicht';
}

export function getConfirmStepSubtitle(isEditMode: boolean, hasChanges: boolean): string {
	if (isEditMode) {
		return hasChanges ? 'Bekijk de wijzigingen en bevestig om op te slaan.' : '';
	}
	return 'Bekijk de samenvatting en bevestig om de overeenkomst aan te maken.';
}
