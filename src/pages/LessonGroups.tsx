import { useCallback, useEffect, useMemo, useState } from 'react';
import { LuCalendarPlus, LuPlus, LuTrash2 } from 'react-icons/lu';
import { Navigate, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { UserDisplay } from '@/components/ui/user-display';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { addDaysToDateStr } from '@/lib/date/date-format';
import { frequencyLabels } from '@/lib/frequencies';
import type { LessonGroupRow } from '@/types/lesson-groups';

interface MemberInfo {
	user_id: string;
	first_name: string | null;
	last_name: string | null;
	email: string | null;
}

interface LessonGroupTableRow extends LessonGroupRow {
	lesson_type_name: string;
	teacher_first_name: string | null;
	teacher_last_name: string | null;
	teacher_email: string | null;
	teacher_avatar_url: string | null;
	members: MemberInfo[];
}

const DAY_LABELS = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];

export default function LessonGroups() {
	const { isAdmin, isSiteAdmin, isPrivileged, isTeacher, isLoading } = useAuth();
	const canView = isAdmin || isSiteAdmin || isPrivileged || isTeacher;
	const canEdit = isAdmin || isSiteAdmin || isPrivileged;

	const navigate = useNavigate();
	const [rows, setRows] = useState<LessonGroupTableRow[]>([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState('');
	const [deleteDialog, setDeleteDialog] = useState<LessonGroupRow | null>(null);

	const load = useCallback(async () => {
		if (!canView) return;
		setLoading(true);
		const { data: groupsData, error } = await supabase.from('lesson_groups').select('*').order('name');
		if (error) {
			toast.error('Fout bij laden lesgroepen', { description: error.message });
			setLoading(false);
			return;
		}
		const groups = groupsData ?? [];
		if (!groups.length) {
			setRows([]);
			setLoading(false);
			return;
		}
		const lessonTypeIds = [...new Set(groups.map((g) => g.lesson_type_id))];
		const teacherIds = [...new Set(groups.map((g) => g.teacher_user_id))];
		const groupIds = groups.map((g) => g.id);

		const [lessonTypesRes, profilesRes, membersRes] = await Promise.all([
			supabase.from('lesson_types').select('id, name').in('id', lessonTypeIds),
			supabase
				.from('view_profiles_with_display_name')
				.select('user_id, first_name, last_name, email, avatar_url')
				.in('user_id', teacherIds),
			supabase
				.from('lesson_group_members')
				.select('lesson_group_id')
				.in('lesson_group_id', groupIds)
				.is('left_date', null),
		]);

		const lessonTypeMap = new Map((lessonTypesRes.data ?? []).map((lt) => [lt.id, lt]));
		const profileMap = new Map((profilesRes.data ?? []).map((p) => [p.user_id, p]));
		const memberCounts = new Map<string, number>();
		for (const m of membersRes.data ?? []) {
			memberCounts.set(m.lesson_group_id, (memberCounts.get(m.lesson_group_id) ?? 0) + 1);
		}

		setRows(
			groups.map((g) => {
				const lt = lessonTypeMap.get(g.lesson_type_id);
				const teacher = profileMap.get(g.teacher_user_id);
				return {
					...g,
					lesson_type_name: lt?.name ?? '—',
					teacher_first_name: teacher?.first_name ?? null,
					teacher_last_name: teacher?.last_name ?? null,
					teacher_email: teacher?.email ?? null,
					teacher_avatar_url: teacher?.avatar_url ?? null,
					members_count: memberCounts.get(g.id) ?? 0,
				};
			}),
		);
		setLoading(false);
	}, [canView]);

	useEffect(() => {
		if (!isLoading) load();
	}, [isLoading, load]);

	const handleScheduleInAgenda = useCallback(async (group: LessonGroupTableRow) => {
		// Compute the first occurrence date (>= start_date matching day_of_week)
		const start = new Date(group.start_date + 'T12:00:00');
		const offset = (group.day_of_week - start.getDay() + 7) % 7;
		const firstDateStr = addDaysToDateStr(group.start_date, offset);
		const endTime = (() => {
			const [h, m] = group.start_time.split(':').map(Number);
			const total = h * 60 + (m ?? 0) + group.duration_minutes;
			const eh = Math.floor(total / 60) % 24;
			const em = total % 60;
			return `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}:00`;
		})();
		const { error } = await supabase.from('agenda_events').insert({
			source_type: 'lesson_group',
			source_id: group.id,
			owner_user_id: group.teacher_user_id,
			title: group.name,
			start_date: firstDateStr,
			start_time: group.start_time,
			end_date: firstDateStr,
			end_time: endTime,
			is_all_day: false,
			recurring: true,
			recurring_frequency: group.frequency,
			recurring_end_date: group.end_date,
		});
		if (error) {
			toast.error('Plannen mislukt', { description: error.message });
			return;
		}
		toast.success('Lesgroep ingepland in agenda');
	}, []);

	const columns: DataTableColumn<LessonGroupTableRow>[] = useMemo(
		() => [
			{
				key: 'name',
				label: 'Naam',
				sortable: true,
				sortValue: (g) => g.name.toLowerCase(),
				render: (g) => <span className="font-medium">{g.name}</span>,
			},
			{
				key: 'lesson_type',
				label: 'Lestype',
				sortable: true,
				sortValue: (g) => g.lesson_type_name.toLowerCase(),
				render: (g) => <span className="text-muted-foreground">{g.lesson_type_name}</span>,
			},
			{
				key: 'teacher',
				label: 'Docent',
				render: (g) => (
					<UserDisplay
						profile={{
							first_name: g.teacher_first_name,
							last_name: g.teacher_last_name,
							email: g.teacher_email,
							avatar_url: g.teacher_avatar_url,
						}}
					/>
				),
			},
			{
				key: 'schedule',
				label: 'Schema',
				render: (g) => (
					<span className="text-muted-foreground">
						{DAY_LABELS[g.day_of_week]} {g.start_time.slice(0, 5)} · {frequencyLabels[g.frequency]}
					</span>
				),
			},
			{
				key: 'members',
				label: 'Deelnemers',
				sortable: true,
				sortValue: (g) => g.members_count,
				render: (g) => <span className="text-muted-foreground">{g.members_count}</span>,
			},
			{
				key: 'status',
				label: 'Status',
				sortable: true,
				sortValue: (g) => (g.is_active ? 1 : 0),
				render: (g) => (
					<Badge variant={g.is_active ? 'default' : 'secondary'}>{g.is_active ? 'Actief' : 'Inactief'}</Badge>
				),
			},
		],
		[],
	);

	const confirmDelete = useCallback(async () => {
		if (!deleteDialog) return;
		const { error } = await supabase.from('lesson_groups').delete().eq('id', deleteDialog.id);
		if (error) {
			toast.error('Verwijderen mislukt', { description: error.message });
			throw new Error(error.message);
		}
		toast.success('Lesgroep verwijderd');
		setDeleteDialog(null);
		load();
	}, [deleteDialog, load]);

	if (!isLoading && !canView) return <Navigate to="/" replace />;

	return (
		<div>
			<DataTable
				title="Groepslessen"
				description="Beheer lesgroepen en hun deelnemers"
				data={rows}
				columns={columns}
				searchQuery={search}
				onSearchChange={setSearch}
				searchFields={[(g) => g.name, (g) => g.lesson_type_name]}
				loading={loading}
				getRowKey={(g) => g.id}
				emptyMessage="Geen lesgroepen gevonden"
				initialSortColumn="name"
				initialSortDirection="asc"
				headerActions={
					canEdit ? (
						<Button onClick={() => navigate('/lesson-groups/new')}>
							<LuPlus className="mr-2 h-4 w-4" />
							Nieuwe lesgroep
						</Button>
					) : undefined
				}
				rowActions={{
					onEdit: canEdit ? (g) => navigate(`/lesson-groups/${g.id}`) : undefined,
					render: canEdit
						? (g) => (
								<div className="flex items-center gap-1">
									<Button
										type="button"
										size="icon"
										variant="ghost"
										className="h-8 w-8"
										onClick={(e) => {
											e.stopPropagation();
											handleScheduleInAgenda(g);
										}}
										title="Plan in agenda"
									>
										<LuCalendarPlus className="h-4 w-4" />
									</Button>
									<Button
										type="button"
										size="icon"
										variant="ghost"
										className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
										onClick={(e) => {
											e.stopPropagation();
											setDeleteDialog(g);
										}}
										title="Verwijderen"
									>
										<LuTrash2 className="h-4 w-4" />
									</Button>
								</div>
							)
						: undefined,
				}}
			/>
			{deleteDialog && (
				<ConfirmDeleteDialog
					open={!!deleteDialog}
					onOpenChange={(open) => !open && setDeleteDialog(null)}
					title="Lesgroep verwijderen"
					description={
						<>
							Weet je zeker dat je <strong>{deleteDialog.name}</strong> wilt verwijderen? Alle
							bijbehorende agenda-afspraken worden ook verwijderd.
						</>
					}
					onConfirm={confirmDelete}
				/>
			)}
		</div>
	);
}
