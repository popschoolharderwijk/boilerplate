import { useCallback, useEffect, useState } from 'react';
import { LuPlus } from 'react-icons/lu';
import { Navigate, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { LessonTypeBadge } from '@/components/ui/lesson-type-badge';
import { UserDisplay } from '@/components/ui/user-display';
import { NAV_LABELS } from '@/config/nav-labels';
import { useActiveLessonTypes } from '@/hooks/useActiveLessonTypes';
import { useAuth } from '@/hooks/useAuth';
import { useListPageTableState } from '@/hooks/useListPageTableState';
import { supabase } from '@/integrations/supabase/client';
import { filterAgreementRows, sortAgreementRows } from '@/lib/agreements/agreementListHelpers';
import { mapRawAgreementToTableRow, type RawAgreementRow } from '@/lib/agreements/mapAgreementTableRow';
import { formatDateTimeShort } from '@/lib/date/date-format';
import { DAY_NAMES } from '@/lib/date/day-index';
import { getDisplayName } from '@/lib/display-name';
import { frequencyLabels } from '@/lib/frequencies';
import { formatTime } from '@/lib/time/time-format';
import type { AgreementTableRow } from '@/types/lesson-agreements';

type AgreementAction =
	| { kind: 'edit'; agreement: AgreementTableRow }
	| { kind: 'delete'; agreement: AgreementTableRow }
	| { kind: 'confirm-delete' };

const EMPTY_PROFILE = { first_name: null, last_name: null, avatar_url: null, email: '' };

const AGREEMENT_COLUMNS: DataTableColumn<AgreementTableRow>[] = [
	{
		key: 'student',
		label: 'Leerling',
		sortable: true,
		render: (r) => <UserDisplay profile={r.student} href={`/students/${r.student_user_id}`} showEmail />,
	},
	{
		key: 'teacher',
		label: 'Docent',
		sortable: true,
		render: (r) => <UserDisplay profile={r.teacher} href={`/teachers/${r.teacher_user_id}`} />,
	},
	{
		key: 'lesson',
		label: 'Les',
		sortable: true,
		className: 'w-32',
		render: (r) => (
			<div className="flex items-center gap-2">
				<LessonTypeBadge lessonType={r.lesson_type} size="sm" showName={false} />
				<div>
					<div className="flex items-center gap-1">
						<span>{DAY_NAMES[r.day_of_week]?.slice(0, 2)}</span>
						<span className="text-muted-foreground">{formatTime(r.start_time)}</span>
						{r.duo_pair_id && (
							<span
								className="rounded bg-primary/10 px-1 py-0.5 text-[10px] font-medium text-primary"
								title="Duo-overeenkomst"
							>
								Duo
							</span>
						)}
					</div>
					<p className="text-xs text-muted-foreground">{frequencyLabels[r.frequency]}</p>
				</div>
			</div>
		),
	},
	{
		key: 'duration_minutes',
		label: 'Duur',
		sortable: true,
		sortValue: (r) => r.duration_minutes,
		className: 'w-24',
		render: (r) => `${r.duration_minutes} min`,
	},
	{
		key: 'end_date',
		label: 'Einddatum',
		sortable: true,
		className: 'w-36',
		render: (r) => {
			const end = r.end_date
				? new Date(r.end_date).toLocaleDateString('nl-NL', {
						day: 'numeric',
						month: 'short',
						year: 'numeric',
					})
				: '∞';
			return (
				<div className="flex items-center gap-1.5">
					{!r.is_active && (
						<span className="h-2 w-2 shrink-0 rounded-full bg-muted-foreground/50" title="Inactief" />
					)}
					<span className="text-muted-foreground">{end}</span>
				</div>
			);
		},
	},
	{
		key: 'created_at',
		label: 'Aangemaakt',
		sortable: true,
		className: 'w-36',
		render: (r) => <span className="text-muted-foreground">{formatDateTimeShort(new Date(r.created_at))}</span>,
	},
];

const AGREEMENTS_LIST_SELECT =
	'id, created_at, day_of_week, start_time, start_date, end_date, is_active, notes, student_user_id, teacher_user_id, lesson_type_id, duration_minutes, frequency, price_per_lesson, duo_pair_id, lesson_types(id, name, icon, color), teachers(user_id)';

function agreementsListQuery() {
	return supabase.from('lesson_agreements').select(AGREEMENTS_LIST_SELECT, { count: 'exact' });
}

type AgreementsListQuery = ReturnType<typeof agreementsListQuery>;

function applyAgreementFilters(
	query: AgreementsListQuery,
	statusFilter: string | null,
	selectedLessonTypeId: string | null,
) {
	let q = query;
	if (statusFilter === 'active') q = q.eq('is_active', true);
	if (statusFilter === 'inactive') q = q.eq('is_active', false);
	if (selectedLessonTypeId) q = q.eq('lesson_type_id', selectedLessonTypeId);
	return q;
}

function applyAgreementSort(
	query: AgreementsListQuery,
	sortColumn: string | null,
	sortDirection: 'asc' | 'desc' | null,
) {
	const asc = sortDirection === 'asc';
	if (sortColumn === 'student' || sortColumn === 'teacher') {
		return query.order('start_date', { ascending: false });
	}
	if (sortColumn === 'created_at') return query.order('created_at', { ascending: asc });
	if (sortColumn === 'dayAndTime') {
		return query.order('day_of_week', { ascending: asc }).order('start_time', { ascending: asc });
	}
	if (sortColumn === 'end_date') return query.order('end_date', { ascending: asc, nullsFirst: false });
	if (sortColumn === 'duration_minutes') return query.order('duration_minutes', { ascending: asc });
	if (sortColumn === 'status') return query.order('is_active', { ascending: asc });
	return query.order('start_date', { ascending: false });
}

export default function Agreements() {
	const { isPrivileged, isLoading: authLoading } = useAuth();
	const navigate = useNavigate();
	const hasAccess = isPrivileged;
	const { lessonTypes } = useActiveLessonTypes(hasAccess);
	const [agreements, setAgreements] = useState<AgreementTableRow[]>([]);
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
		storageKey: 'agreements',
		initialSortColumn: 'created_at',
		initialSortDirection: 'desc',
		lessonTypes,
	});

	const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; agreement: AgreementTableRow | null } | null>(
		null,
	);

	const loadAgreements = useCallback(() => {
		if (authLoading || !hasAccess) return;

		setLoading(true);
		let query = agreementsListQuery();

		query = applyAgreementFilters(query, statusFilter, selectedLessonTypeId);
		query = applyAgreementSort(query, sortColumn, sortDirection);

		void Promise.resolve(query)
			.then(async ({ data: agreementsData, error: agreementsError, count }) => {
				if (agreementsError) {
					console.error('Error loading agreements:', agreementsError);
					toast.error('Fout bij laden overeenkomsten');
					setLoading(false);
					return;
				}

				const raw = (agreementsData ?? []) as unknown as RawAgreementRow[];
				const studentUserIds = [...new Set(raw.map((a) => a.student_user_id))];
				const teacherUserIds = [
					...new Set(
						raw
							.map((a) => {
								const teachers = a.teachers;
								const ref = Array.isArray(teachers) ? teachers[0] : teachers;
								return ref?.user_id;
							})
							.filter(Boolean) as string[],
					),
				];
				const allUserIds = [...new Set([...studentUserIds, ...teacherUserIds])];

				if (allUserIds.length === 0) {
					setAgreements(
						raw.map((a) => mapRawAgreementToTableRow(a, new Map(), EMPTY_PROFILE, EMPTY_PROFILE)),
					);
					setTotalCount(0);
					setLoading(false);
					return;
				}

				const { data: profilesData, error: profilesError } = await supabase
					.from('profiles')
					.select('user_id, first_name, last_name, avatar_url, email')
					.in('user_id', allUserIds);

				if (profilesError) {
					console.error('Error loading profiles:', profilesError);
					toast.error('Fout bij laden profielen');
					setLoading(false);
					return;
				}

				const profileMap = new Map(
					(profilesData ?? []).map((p) => [
						p.user_id,
						{
							first_name: p.first_name,
							last_name: p.last_name,
							avatar_url: p.avatar_url ?? null,
							email: p.email ?? '',
						},
					]),
				);

				let rows = raw.map((a) => mapRawAgreementToTableRow(a, profileMap, EMPTY_PROFILE, EMPTY_PROFILE));
				rows = filterAgreementRows(rows, debouncedSearchQuery);
				rows = sortAgreementRows(rows, sortColumn, sortDirection);

				const startIndex = (currentPage - 1) * rowsPerPage;
				setAgreements(rows.slice(startIndex, startIndex + rowsPerPage));
				setTotalCount(debouncedSearchQuery ? rows.length : (count ?? rows.length));
				setLoading(false);
			})
			.catch((error) => {
				console.error('Error loading agreements:', error);
				toast.error('Fout bij laden overeenkomsten');
				setLoading(false);
			});
	}, [
		authLoading,
		hasAccess,
		statusFilter,
		selectedLessonTypeId,
		debouncedSearchQuery,
		sortColumn,
		sortDirection,
		currentPage,
		rowsPerPage,
		setLoading,
		setTotalCount,
	]);

	useEffect(() => {
		loadAgreements();
	}, [loadAgreements]);

	const reloadAgreements = loadAgreements;

	const runAction = async (action: AgreementAction) => {
		if (action.kind === 'edit') {
			navigate(`/agreements/${action.agreement.id}`);
			return;
		}
		if (action.kind === 'delete') {
			setDeleteDialog({ open: true, agreement: action.agreement });
			return;
		}

		if (!deleteDialog?.agreement) return;
		const { error } = await supabase.from('lesson_agreements').delete().eq('id', deleteDialog.agreement.id);
		if (error) {
			toast.error('Fout bij verwijderen overeenkomst', { description: error.message });
			throw new Error(error.message);
		}
		toast.success('Overeenkomst verwijderd');
		setDeleteDialog(null);
		reloadAgreements();
	};

	if (!authLoading && !hasAccess) {
		return <Navigate to="/" replace />;
	}

	return (
		<div>
			<DataTable
				title={NAV_LABELS.agreements}
				description="Beheer lesovereenkomsten tussen leerlingen en docenten"
				data={agreements}
				columns={AGREEMENT_COLUMNS}
				searchQuery={searchQuery}
				onSearchChange={handleSearchChange}
				loading={loading}
				getRowKey={(r) => r.id}
				emptyMessage="Geen overeenkomsten gevonden"
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
				headerActions={
					<Button onClick={() => navigate('/agreements/new')}>
						<LuPlus className="mr-2 h-4 w-4" />
						Overeenkomst toevoegen
					</Button>
				}
				rowActions={{
					onEdit: (agreement) => runAction({ kind: 'edit', agreement }),
					onDelete: (agreement) => runAction({ kind: 'delete', agreement }),
				}}
			/>

			{deleteDialog && (
				<ConfirmDeleteDialog
					open={deleteDialog.open}
					onOpenChange={(open) => !open && setDeleteDialog(null)}
					title="Overeenkomst verwijderen"
					description={
						<>
							Weet je zeker dat je de lesovereenkomst van{' '}
							<strong>
								{getDisplayName(
									deleteDialog.agreement?.student ?? { first_name: null, last_name: null },
								)}
							</strong>{' '}
							wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.
							<p className="mt-2 text-muted-foreground">
								Alle gegevens van deze overeenkomst worden permanent verwijderd.
							</p>
						</>
					}
					onConfirm={() => runAction({ kind: 'confirm-delete' })}
				/>
			)}
		</div>
	);
}
