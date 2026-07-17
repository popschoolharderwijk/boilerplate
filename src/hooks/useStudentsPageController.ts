import { useCallback, useEffect, useState } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import type { SignupRequestDetail } from '@/components/students/SignupRequestDialog';
import {
	applyStudentsPageLoadOutcome,
	executeStudentsPageLoad,
	runStudentPageAction,
	type StudentAction,
} from '@/lib/students/studentsPageControllerHelpers';
import { buildStudentColumns } from '@/lib/students/studentsTableColumns';
import type { StudentWithAgreements } from '@/types/students';

interface UseStudentsPageControllerParams {
	authLoading: boolean;
	hasAccess: boolean;
	navigate: NavigateFunction;
	currentPage: number;
	rowsPerPage: number;
	debouncedSearchQuery: string;
	statusFilter: 'active' | 'inactive' | 'all' | null;
	selectedLessonTypeId: string | null;
	sortColumn: string | null;
	sortDirection: 'asc' | 'desc' | null;
	setLoading: (loading: boolean) => void;
	setTotalCount: (count: number) => void;
}

export function useStudentsPageController(params: UseStudentsPageControllerParams) {
	const [students, setStudents] = useState<StudentWithAgreements[]>([]);
	const [requestsByEmail, setRequestsByEmail] = useState<Map<string, SignupRequestDetail[]>>(new Map());
	const [deleteDialog, setDeleteDialog] = useState<{
		open: boolean;
		student: StudentWithAgreements;
		deleteUser: boolean;
	} | null>(null);
	const [studentFormDialog, setStudentFormDialog] = useState<{
		open: boolean;
		student: StudentWithAgreements | null;
	}>({ open: false, student: null });

	const loadStudents = useCallback(async () => {
		params.setLoading(true);
		const shouldStopLoading = applyStudentsPageLoadOutcome(
			await executeStudentsPageLoad({
				authLoading: params.authLoading,
				hasAccess: params.hasAccess,
				limit: params.rowsPerPage,
				offset: (params.currentPage - 1) * params.rowsPerPage,
				search: params.debouncedSearchQuery,
				statusFilter: params.statusFilter,
				lessonTypeId: params.selectedLessonTypeId,
				sortColumn: params.sortColumn,
				sortDirection: params.sortDirection,
			}),
			setStudents,
			params.setTotalCount,
			setRequestsByEmail,
		);
		if (shouldStopLoading) {
			params.setLoading(false);
		}
	}, [params]);

	useEffect(() => {
		void loadStudents();
	}, [loadStudents]);

	const runAction = (action: StudentAction) =>
		runStudentPageAction(action, deleteDialog, {
			setStudentFormDialog,
			setDeleteDialog,
			loadStudents,
		});

	const columns = buildStudentColumns(params.navigate, requestsByEmail);

	return {
		students,
		columns,
		deleteDialog,
		setDeleteDialog,
		studentFormDialog,
		setStudentFormDialog,
		loadStudents,
		runAction,
	};
}
