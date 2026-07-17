import { useCallback, useEffect, useState } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import { type AgreementAction, runAgreementPageAction } from '@/lib/agreements/agreementsPageActionHelpers';
import { applyAgreementsPageLoadOutcome, executeAgreementsPageLoad } from '@/lib/agreements/agreementsPageLoadHelpers';
import type { AgreementTableRow } from '@/types/lesson-agreements';

interface UseAgreementsPageControllerParams {
	authLoading: boolean;
	hasAccess: boolean;
	navigate: NavigateFunction;
	statusFilter: string | null;
	selectedLessonTypeId: string | null;
	debouncedSearchQuery: string;
	sortColumn: string | null;
	sortDirection: 'asc' | 'desc' | null;
	currentPage: number;
	rowsPerPage: number;
	setLoading: (loading: boolean) => void;
	setTotalCount: (count: number) => void;
}

export function useAgreementsPageController(params: UseAgreementsPageControllerParams) {
	const [agreements, setAgreements] = useState<AgreementTableRow[]>([]);
	const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; agreement: AgreementTableRow | null } | null>(
		null,
	);

	const loadAgreements = useCallback(async () => {
		params.setLoading(true);
		const shouldStopLoading = applyAgreementsPageLoadOutcome(
			await executeAgreementsPageLoad({
				authLoading: params.authLoading,
				hasAccess: params.hasAccess,
				statusFilter: params.statusFilter,
				selectedLessonTypeId: params.selectedLessonTypeId,
				debouncedSearchQuery: params.debouncedSearchQuery,
				sortColumn: params.sortColumn,
				sortDirection: params.sortDirection,
				currentPage: params.currentPage,
				rowsPerPage: params.rowsPerPage,
			}),
			setAgreements,
			params.setTotalCount,
		);
		if (shouldStopLoading) {
			params.setLoading(false);
		}
	}, [params]);

	useEffect(() => {
		void loadAgreements();
	}, [loadAgreements]);

	const runAction = (action: AgreementAction) =>
		runAgreementPageAction(action, deleteDialog, {
			navigate: params.navigate,
			setDeleteDialog,
			reloadAgreements: loadAgreements,
		});

	return {
		agreements,
		deleteDialog,
		setDeleteDialog,
		loadAgreements,
		runAction,
	};
}
