import type { CancellationType } from '@/types/agenda-events';

export interface ConfirmCancelDialogState {
	cancellationType: CancellationType;
	selectedIds: string[];
	cancelAll: boolean;
}

export function createInitialConfirmCancelState(
	isGroup: boolean,
	initialCancelledIds: string[] | null | undefined,
): ConfirmCancelDialogState {
	return {
		cancellationType: 'student',
		selectedIds: initialCancelledIds ?? [],
		cancelAll: !isGroup,
	};
}

export function toggleCancelledParticipantId(selectedIds: string[], id: string): string[] {
	return selectedIds.includes(id)
		? selectedIds.filter((participantId) => participantId !== id)
		: [...selectedIds, id];
}

export function canConfirmCancel(isGroup: boolean, cancelAll: boolean, selectedIds: string[]): boolean {
	return !isGroup || cancelAll || selectedIds.length > 0;
}

function buildCancelConfirmPayload(
	isGroup: boolean,
	cancelAll: boolean,
	selectedIds: string[],
	cancellationType: CancellationType,
): { cancellationType: CancellationType; cancelledParticipantIds: string[] | null } {
	return {
		cancellationType,
		cancelledParticipantIds: isGroup && !cancelAll ? selectedIds : null,
	};
}

export function getCancelStudentLabel(isGroup: boolean, cancelAll: boolean): string {
	return isGroup && !cancelAll ? 'Deelnemer(s) hebben afgezegd' : 'Leerling heeft afgezegd';
}

export function isConfirmCancelTeacherDisabled(isGroup: boolean, cancelAll: boolean): boolean {
	return isGroup && !cancelAll;
}

export function handleConfirmCancelSelection(
	onOpenChange: (open: boolean) => void,
	onConfirm: (cancellationType: CancellationType, cancelledParticipantIds: string[] | null) => void,
	isGroup: boolean,
	cancelAll: boolean,
	selectedIds: string[],
	cancellationType: CancellationType,
): void {
	onOpenChange(false);
	const payload = buildCancelConfirmPayload(isGroup, cancelAll, selectedIds, cancellationType);
	onConfirm(payload.cancellationType, payload.cancelledParticipantIds);
}
