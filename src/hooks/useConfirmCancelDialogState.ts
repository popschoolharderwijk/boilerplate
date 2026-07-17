import { useEffect, useState } from 'react';
import {
	type ConfirmCancelDialogState,
	createInitialConfirmCancelState,
	toggleCancelledParticipantId,
} from '@/lib/agenda/confirmCancelDialogHelpers';
import type { CancellationType } from '@/types/agenda-events';

export function useConfirmCancelDialogState(
	open: boolean,
	isGroup: boolean,
	initialCancelledIds: string[] | null | undefined,
) {
	const [state, setState] = useState<ConfirmCancelDialogState>(() =>
		createInitialConfirmCancelState(isGroup, initialCancelledIds),
	);

	useEffect(() => {
		if (!open) return;
		setState(createInitialConfirmCancelState(isGroup, initialCancelledIds));
	}, [open, initialCancelledIds, isGroup]);

	const setCancellationType = (cancellationType: CancellationType) => {
		setState((prev) => ({ ...prev, cancellationType }));
	};

	const setCancelAll = (cancelAll: boolean) => {
		setState((prev) => ({ ...prev, cancelAll }));
	};

	const toggleParticipant = (id: string) => {
		setState((prev) => ({
			...prev,
			selectedIds: toggleCancelledParticipantId(prev.selectedIds, id),
		}));
	};

	return {
		cancellationType: state.cancellationType,
		selectedIds: state.selectedIds,
		cancelAll: state.cancelAll,
		setCancellationType,
		setCancelAll,
		toggleParticipant,
	};
}
