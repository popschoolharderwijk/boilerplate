import { useCallback, useEffect, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { LessonAgreementItem } from '@/components/students/LessonAgreementItem';
import type { SignupRequestDetail } from '@/components/students/SignupRequestDialog';
import { StudentFormDialog } from '@/components/students/StudentFormDialog';
import { Badge } from '@/components/ui/badge';
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { UserDisplay } from '@/components/ui/user-display';
import { NAV_LABELS } from '@/config/nav-labels';
import { useActiveLessonTypes } from '@/hooks/useActiveLessonTypes';
import { useAuth } from '@/hooks/useAuth';
import { useListPageTableState } from '@/hooks/useListPageTableState';
import { supabase } from '@/integrations/supabase/client';
import { getDisplayName } from '@/lib/display-name';
import { fetchSignupRequestsByEmails } from '@/lib/signup-requests/signupRequestMappers';
import {
	flattenStudentWithAgreements,
	type PaginatedStudentsResponseRaw,
	type StudentWithAgreements,
} from '@/types/students';

type StudentAction =
	| { kind: 'edit'; student: StudentWithAgreements }
	| { kind: 'delete'; student: StudentWithAgreements }
	| { kind: 'confirm-delete' };

const STUDENT_SORT_COLUMNS: Record<string, string> = {
	student: 'name',
	phone_number: 'phone_number',
	status: 'status',
	agreements: 'agreements',
};

function buildStudentColumns(
	navigate: (path: string) => void,
	requestsByEmail: Map<string, SignupRequestDetail[]>,
): DataTableColumn<StudentWithAgreements>[] {
	return [
		{
			key: 'student',
			label: 'Leerling',
			sortable: true,
			className: 'w-64 max-w-64',
			render: (s) => (
				<button
					type="button"
					onClick={(e) => {
						e.stopPropagation();
						navigate(`/students/${s.user_id}`);
					}}
					className="text-left hover:underline"
				>
					<UserDisplay profile={s} showEmail />
				</button>
			),
		},
		{
			key: 'phone_number',
			label: 'Telefoon',
			sortable: true,
			render: (s) => <span className="text-muted-foreground">{s.phone_number || '-'}</span>,
			className: 'text-muted-foreground w-32',
		},
		{
			key: 'status',
			label: 'Status',
			sortable: true,
			render: (s) => (
				<Badge variant={s.active_agreements_count > 0 ? 'default' : 'secondary'}>
					{s.active_agreements_count > 0 ? 'Actief' : 'Inactief'}
				</Badge>
			),
			className: 'w-24',
		},
		{
			key: 'agreements',
			label: 'Overeenkomsten',
			sortable: true,
			render: (s) => (
				<button
					type="button"
					onClick={(e) => {
						e.stopPropagation();
						navigate(`/students/${s.user_id}`);
					}}
					className="text-sm hover:underline"
				>
					{s.agreements.length} {s.agreements.length === 1 ? 'overeenkomst' : 'overeenkomsten'}
				</button>
			),
		},
		{
			key: 'signup_requests',
			label: 'Aanmeldingen',
			render: (s) => {
				const count = s.email ? (requestsByEmail.get(s.email)?.length ?? 0) : 0;
				return (
					<button
						type="button"
						onClick={(e) => {
							e.stopPropagation();
							navigate(`/students/${s.user_id}`);
						}}
						className="text-sm hover:underline"
					>
						{count} {count === 1 ? 'aanmelding' : 'aanmeldingen'}
					</button>
				);
			},
		},
	];
}

export default function Students() {
	const navigate = useNavigate();
	const { isAdmin, isSiteAdmin, isPrivileged, isLoading: authLoading } = useAuth();
	const hasAccess = isPrivileged;
	const { lessonTypes } = useActiveLessonTypes(hasAccess);
	const [students, setStudents] = useState<StudentWithAgreements[]>([]);
	const [requestsByEmail, setRequestsByEmail] = useState<Map<string, SignupRequestDetail[]>>(new Map());
	const {
		loading,
		setLoading,
		totalCount,
		setTotalCount,
		searchQuery,
		debouncedSearchQuery,
		handleSearchChange,
		currentPage,
		rowsPerPage,
		handlePageChange,
		handleRowsPerPageChange,
		sortColumn,
		sortDirection,
		handleSortChange,
		statusFilter,
		selectedLessonTypeId,
		quickFilterGroups,
	} = useListPageTableState({
		storageKey: 'students',
		initialSortColumn: 'student',
		initialSortDirection: 'asc',
		lessonTypes,
	});
	const [searchParams, setSearchParams] = useSearchParams();

	// biome-ignore lint/correctness/useExhaustiveDependencies: only run on mount
	useEffect(() => {
		const q = searchParams.get('search');
		if (q) {
			handleSearchChange(q);
			searchParams.delete('search');
			setSearchParams(searchParams, { replace: true });
		}
	}, []);

	const [deleteDialog, setDeleteDialog] = useState<{
		open: boolean;
		student: StudentWithAgreements | null;
		deleteUser: boolean;
	} | null>(null);
	const [studentFormDialog, setStudentFormDialog] = useState<{
		open: boolean;
		student: StudentWithAgreements | null;
	}>({ open: false, student: null });

	const loadStudents = useCallback(() => {
		if (authLoading || !hasAccess) return;

		setLoading(true);
		const offset = (currentPage - 1) * rowsPerPage;
		const dbSortColumn = sortColumn ? (STUDENT_SORT_COLUMNS[sortColumn] ?? 'name') : 'name';

		void Promise.resolve(
			supabase.rpc('get_students_paginated', {
				p_limit: rowsPerPage,
				p_offset: offset,
				p_search: debouncedSearchQuery || null,
				p_status: statusFilter,
				p_lesson_type_id: selectedLessonTypeId,
				p_sort_column: dbSortColumn,
				p_sort_direction: sortDirection || 'asc',
			}),
		)
			.then(async ({ data, error }) => {
				if (error) {
					console.error('Error loading students:', error);
					toast.error('Fout bij laden leerlingen');
					setLoading(false);
					return;
				}

				const result = data as unknown as PaginatedStudentsResponseRaw;
				const flat = (result.data ?? []).map(flattenStudentWithAgreements);
				setStudents(flat);
				setTotalCount(result.total_count ?? 0);

				const emails = flat.map((s) => s.email).filter((e): e is string => Boolean(e));
				setRequestsByEmail(await fetchSignupRequestsByEmails(emails));
				setLoading(false);
			})
			.catch((error) => {
				console.error('Error loading students:', error);
				toast.error('Fout bij laden leerlingen');
				setLoading(false);
			});
	}, [
		authLoading,
		hasAccess,
		currentPage,
		rowsPerPage,
		debouncedSearchQuery,
		statusFilter,
		selectedLessonTypeId,
		sortColumn,
		sortDirection,
		setLoading,
		setTotalCount,
	]);

	useEffect(() => {
		loadStudents();
	}, [loadStudents]);

	const reloadStudents = loadStudents;

	const runAction = async (action: StudentAction) => {
		if (action.kind === 'edit') {
			setStudentFormDialog({ open: true, student: action.student });
			return;
		}
		if (action.kind === 'delete') {
			setDeleteDialog({ open: true, student: action.student, deleteUser: false });
			return;
		}

		if (!deleteDialog?.student) return;

		try {
			if (deleteDialog.deleteUser) {
				const { error: userDeleteError } = await supabase.functions.invoke('delete-user', {
					body: { userId: deleteDialog.student.user_id },
				});
				if (userDeleteError) {
					console.error('Error deleting user:', userDeleteError);
					toast.error('Fout bij verwijderen gebruiker', { description: userDeleteError.message });
					throw new Error(userDeleteError.message);
				}
				toast.success('Leerling en gebruiker verwijderd');
			} else {
				const agreementIds = deleteDialog.student.agreements.map((a) => a.id);
				if (agreementIds.length > 0) {
					const { error: agreementsError } = await supabase
						.from('lesson_agreements')
						.delete()
						.in('id', agreementIds);
					if (agreementsError) {
						console.error('Error deleting lesson agreements:', agreementsError);
						toast.error('Fout bij verwijderen lesovereenkomsten', {
							description: agreementsError.message,
						});
						throw new Error(agreementsError.message);
					}
				}
				toast.success('Leerling verwijderd');
			}

			setDeleteDialog(null);
			reloadStudents();
		} catch (error) {
			console.error('Error deleting student:', error);
			toast.error('Fout bij verwijderen leerling', {
				description: 'Er is een netwerkfout opgetreden. Probeer het later opnieuw.',
			});
			throw error;
		}
	};

	const columns = buildStudentColumns(navigate, requestsByEmail);

	if (!authLoading && !hasAccess) {
		return <Navigate to="/" replace />;
	}

	return (
		<div>
			<DataTable
				title={NAV_LABELS.students}
				description="Beheer alle leerlingen en hun gegevens"
				data={students}
				columns={columns}
				searchQuery={searchQuery}
				onSearchChange={handleSearchChange}
				loading={loading}
				getRowKey={(s) => s.user_id}
				emptyMessage="Geen leerlingen gevonden"
				quickFilter={quickFilterGroups}
				serverPagination={{
					totalCount,
					currentPage,
					rowsPerPage,
					onPageChange: handlePageChange,
					onRowsPerPageChange: handleRowsPerPageChange,
				}}
				initialSortColumn={sortColumn || undefined}
				initialSortDirection={sortDirection || undefined}
				onSortChange={handleSortChange}
				rowActions={{
					onEdit: isPrivileged ? (student) => runAction({ kind: 'edit', student }) : undefined,
					onDelete: isAdmin || isSiteAdmin ? (student) => runAction({ kind: 'delete', student }) : undefined,
				}}
			/>

			<StudentFormDialog
				open={studentFormDialog.open}
				onOpenChange={(open) => setStudentFormDialog({ ...studentFormDialog, open })}
				onSuccess={reloadStudents}
				student={studentFormDialog.student ?? undefined}
			/>

			{deleteDialog && (
				<ConfirmDeleteDialog
					open={deleteDialog.open}
					onOpenChange={(open) => !open && setDeleteDialog(null)}
					title="Leerling verwijderen"
					description={
						<>
							Weet je zeker dat je{' '}
							<strong>
								{deleteDialog.student ? getDisplayName(deleteDialog.student) : 'deze leerling'}
							</strong>{' '}
							wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.
						</>
					}
					onConfirm={() => runAction({ kind: 'confirm-delete' })}
					extraContent={
						<>
							<p className="text-sm text-muted-foreground">
								Alle gegevens van deze leerling worden permanent verwijderd, inclusief{' '}
								{deleteDialog.student?.agreements.length || 0} lesovereenkomst(en).
							</p>
							{deleteDialog.student && deleteDialog.student.agreements.length > 0 && (
								<div className="space-y-2">
									<p className="text-sm font-medium">
										De volgende lesovereenkomsten worden verwijderd:
									</p>
									<div className="max-h-60 overflow-y-auto rounded-md border p-3 space-y-2">
										{deleteDialog.student.agreements.map((agreement) => (
											<LessonAgreementItem
												key={agreement.id}
												agreement={agreement}
												className="w-full"
												readOnly
											/>
										))}
									</div>
								</div>
							)}
							<div className="flex items-center space-x-2">
								<input
									type="checkbox"
									id="delete-user"
									checked={deleteDialog.deleteUser}
									onChange={(e) => setDeleteDialog({ ...deleteDialog, deleteUser: e.target.checked })}
									className="h-4 w-4 rounded border-gray-300"
								/>
								<label htmlFor="delete-user" className="text-sm font-medium">
									Ook de gebruiker verwijderen
								</label>
							</div>
						</>
					}
				/>
			)}
		</div>
	);
}
