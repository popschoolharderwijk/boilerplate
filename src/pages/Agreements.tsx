import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { mapRawAgreementToTableRow, type RawAgreementRow } from '@/lib/agreements/mapAgreementTableRow';
import { formatDateTimeShort } from '@/lib/date/date-format';
import { DAY_NAMES } from '@/lib/date/day-index';
import { getDisplayName } from '@/lib/display-name';
import { frequencyLabels } from '@/lib/frequencies';
import { formatTime } from '@/lib/time/time-format';
import type { AgreementTableRow } from '@/types/lesson-agreements';

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

	const loadAgreements = useCallback(async () => {
		if (!hasAccess) return;

		setLoading(true);

		try {
			let query = supabase
				.from('lesson_agreements')
				.select(
					'id, created_at, day_of_week, start_time, start_date, end_date, is_active, notes, student_user_id, teacher_user_id, lesson_type_id, duration_minutes, frequency, price_per_lesson, duo_pair_id, lesson_types(id, name, icon, color), teachers(user_id)',
					{ count: 'exact' },
				);

			// Apply status filter
			if (statusFilter === 'active') {
				query = query.eq('is_active', true);
			} else if (statusFilter === 'inactive') {
				query = query.eq('is_active', false);
			}

			// Apply lesson type filter
			if (selectedLessonTypeId) {
				query = query.eq('lesson_type_id', selectedLessonTypeId);
			}

			// Apply sorting
			const sortAsc = sortDirection === 'asc';
			if (sortColumn === 'student' || sortColumn === 'teacher') {
				// For student/teacher sorting, we sort after fetching (need profile data)
				query = query.order('start_date', { ascending: false });
			} else if (sortColumn === 'created_at') {
				query = query.order('created_at', { ascending: sortAsc });
			} else if (sortColumn === 'dayAndTime') {
				query = query.order('day_of_week', { ascending: sortAsc }).order('start_time', { ascending: sortAsc });
			} else if (sortColumn === 'end_date') {
				query = query.order('end_date', { ascending: sortAsc, nullsFirst: false });
			} else if (sortColumn === 'duration_minutes') {
				query = query.order('duration_minutes', { ascending: sortAsc });
			} else if (sortColumn === 'status') {
				query = query.order('is_active', { ascending: sortAsc });
			} else {
				query = query.order('start_date', { ascending: false });
			}

			const { data: agreementsData, error: agreementsError, count } = await query;

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

			const emptyStudent = { first_name: null, last_name: null, avatar_url: null, email: '' };
			const emptyTeacher = { first_name: null, last_name: null, avatar_url: null, email: '' };

			if (allUserIds.length === 0) {
				setAgreements(raw.map((a) => mapRawAgreementToTableRow(a, new Map(), emptyStudent, emptyTeacher)));
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

			let rows: AgreementTableRow[] = raw.map((a) =>
				mapRawAgreementToTableRow(a, profileMap, emptyStudent, emptyTeacher),
			);

			// Apply search filter (client-side since we need profile data)
			if (debouncedSearchQuery) {
				const query = debouncedSearchQuery.toLowerCase();
				rows = rows.filter((row) => {
					const studentName = `${row.student.first_name ?? ''} ${row.student.last_name ?? ''}`.toLowerCase();
					const teacherName = `${row.teacher.first_name ?? ''} ${row.teacher.last_name ?? ''}`.toLowerCase();
					const lessonType = row.lesson_type.name.toLowerCase();
					const email = (row.student.email ?? '').toLowerCase();
					return (
						studentName.includes(query) ||
						teacherName.includes(query) ||
						lessonType.includes(query) ||
						email.includes(query)
					);
				});
			}

			// Apply client-side sorting for student/teacher columns
			if (sortColumn === 'student') {
				rows.sort((a, b) => {
					const aName = `${a.student.first_name ?? ''} ${a.student.last_name ?? ''}`.toLowerCase();
					const bName = `${b.student.first_name ?? ''} ${b.student.last_name ?? ''}`.toLowerCase();
					return sortDirection === 'asc' ? aName.localeCompare(bName) : bName.localeCompare(aName);
				});
			} else if (sortColumn === 'teacher') {
				rows.sort((a, b) => {
					const aName = `${a.teacher.first_name ?? ''} ${a.teacher.last_name ?? ''}`.toLowerCase();
					const bName = `${b.teacher.first_name ?? ''} ${b.teacher.last_name ?? ''}`.toLowerCase();
					return sortDirection === 'asc' ? aName.localeCompare(bName) : bName.localeCompare(aName);
				});
			}

			// Apply pagination (client-side)
			const startIndex = (currentPage - 1) * rowsPerPage;
			const paginatedRows = rows.slice(startIndex, startIndex + rowsPerPage);

			setAgreements(paginatedRows);
			setTotalCount(debouncedSearchQuery ? rows.length : (count ?? rows.length));
			setLoading(false);
		} catch (error) {
			console.error('Error loading agreements:', error);
			toast.error('Fout bij laden overeenkomsten');
			setLoading(false);
		}
	}, [
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
		if (!authLoading) {
			loadAgreements();
		}
	}, [authLoading, loadAgreements]);

	const handleEdit = useCallback(
		(agreement: AgreementTableRow) => {
			navigate(`/agreements/${agreement.id}`);
		},
		[navigate],
	);

	const handleDelete = useCallback((agreement: AgreementTableRow) => {
		setDeleteDialog({ open: true, agreement });
	}, []);

	const confirmDelete = useCallback(async () => {
		if (!deleteDialog?.agreement) return;
		const { error } = await supabase.from('lesson_agreements').delete().eq('id', deleteDialog.agreement.id);
		if (error) {
			toast.error('Fout bij verwijderen overeenkomst', { description: error.message });
			throw new Error(error.message);
		}
		toast.success('Overeenkomst verwijderd');
		setDeleteDialog(null);
		loadAgreements();
	}, [deleteDialog, loadAgreements]);

	const columns: DataTableColumn<AgreementTableRow>[] = useMemo(
		() => [
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
								<span
									className="h-2 w-2 shrink-0 rounded-full bg-muted-foreground/50"
									title="Inactief"
								/>
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
				render: (r) => (
					<span className="text-muted-foreground">{formatDateTimeShort(new Date(r.created_at))}</span>
				),
			},
		],
		[],
	);

	// Redirect if no access
	if (!authLoading && !hasAccess) {
		return <Navigate to="/" replace />;
	}

	return (
		<div>
			<DataTable
				title={NAV_LABELS.agreements}
				description="Beheer lesovereenkomsten tussen leerlingen en docenten"
				data={agreements}
				columns={columns}
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
					onEdit: handleEdit,
					onDelete: handleDelete,
				}}
			/>

			{/* Delete Agreement Dialog */}
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
					onConfirm={confirmDelete}
				/>
			)}
		</div>
	);
}
