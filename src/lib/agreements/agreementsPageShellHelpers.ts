import type { AgreementTableRow } from '@/types/lesson-agreements';

export function buildAgreementDeleteDialogOpenChangeHandler(
	setDeleteDialog: (value: null) => void,
): (open: boolean) => void {
	return (open) => {
		if (!open) setDeleteDialog(null);
	};
}

export function buildAgreementDeleteDescription(agreement: AgreementTableRow | null | undefined) {
	return agreement?.student ?? { first_name: null, last_name: null };
}
