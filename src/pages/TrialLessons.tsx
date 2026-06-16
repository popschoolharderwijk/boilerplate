import { useCallback, useEffect, useMemo, useState } from 'react';
import { LuGraduationCap, LuPlus } from 'react-icons/lu';
import { Navigate, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ScheduleTrialLessonDialog } from '@/components/trial-lessons/ScheduleTrialLessonDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { PageHeader } from '@/components/ui/page-header';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { formatDbDateLong } from '@/lib/date/date-format';
import { type EnrichedTrialLessonStaff, enrichTrialLessons } from '@/lib/trial-lessons/enrichTrialLessons';
import { getTrialStatusLabel } from '@/lib/trial-lessons/statusLabels';

type Row = EnrichedTrialLessonStaff;

export default function TrialLessons() {
	const { isPrivileged, isLoading } = useAuth();
	const navigate = useNavigate();
	const [rows, setRows] = useState<Row[]>([]);
	const [loading, setLoading] = useState(true);
	const [openSchedule, setOpenSchedule] = useState(false);

	const load = useCallback(async () => {
		setLoading(true);
		const { data, error } = await supabase
			.from('trial_lessons')
			.select('*')
			.order('scheduled_date', { ascending: false });
		if (error) {
			setLoading(false);
			toast.error('Fout bij laden proeflessen');
			return;
		}
		const trials = data ?? [];
		setRows((await enrichTrialLessons(trials, { includeStudent: true })) as Row[]);
		setLoading(false);
	}, []);

	useEffect(() => {
		if (isPrivileged) load();
	}, [isPrivileged, load]);

	const setStatus = useCallback(
		async (row: Row, status: Row['status']) => {
			const { error } = await supabase
				.from('trial_lessons')
				.update({ status, admin_processed_at: new Date().toISOString() })
				.eq('id', row.id);
			if (error) {
				toast.error('Kon status niet bijwerken');
				return;
			}
			toast.success('Status bijgewerkt');
			load();
		},
		[load],
	);

	const convert = useCallback(
		(row: Row) => {
			const params = new URLSearchParams({
				fromTrial: row.id,
				studentUserId: row.student_user_id,
				lessonTypeId: row.lesson_type_id,
			});
			if (row.lesson_type_option_id) params.set('optionId', row.lesson_type_option_id);
			navigate(`/agreements/new?${params.toString()}`);
		},
		[navigate],
	);

	const columns: DataTableColumn<Row>[] = useMemo(
		() => [
			{
				key: 'scheduled_date',
				label: 'Datum',
				render: (r) => (
					<div>
						<div className="text-sm">{formatDbDateLong(r.scheduled_date)}</div>
						<div className="text-xs text-muted-foreground">
							{r.scheduled_start_time.slice(0, 5)} · {r.duration_minutes} min
						</div>
					</div>
				),
			},
			{
				key: 'student',
				label: 'Leerling',
				render: (r) => (
					<div>
						<div className="font-medium">{r.student_name}</div>
						<div className="text-xs text-muted-foreground">{r.student_email}</div>
					</div>
				),
			},
			{
				key: 'teacher',
				label: 'Docent',
				render: (r) => <span className="text-sm">{r.teacher_name}</span>,
			},
			{
				key: 'lesson_type',
				label: 'Lessoort',
				render: (r) => <span className="text-sm">{r.lesson_type_name ?? '—'}</span>,
			},
			{
				key: 'status',
				label: 'Status',
				render: (r) => (
					<Badge
						variant={
							r.status === 'student_confirmed'
								? 'default'
								: r.status === 'student_declined' || r.status === 'cancelled'
									? 'outline'
									: 'secondary'
						}
					>
						{getTrialStatusLabel(r.status, 'staff')}
					</Badge>
				),
			},
			{
				key: 'actions',
				label: '',
				render: (r) => (
					<div className="flex gap-2 justify-end">
						{r.status === 'scheduled' && (
							<Button size="sm" variant="outline" onClick={() => setStatus(r, 'completed')}>
								Markeer gegeven
							</Button>
						)}
						{r.status === 'student_confirmed' && (
							<Button size="sm" onClick={() => convert(r)}>
								Maak overeenkomst
							</Button>
						)}
						{(r.status === 'scheduled' || r.status === 'completed') && (
							<Button size="sm" variant="outline" onClick={() => setStatus(r, 'cancelled')}>
								Annuleren
							</Button>
						)}
					</div>
				),
			},
		],
		[convert, setStatus],
	);

	if (isLoading) return null;
	if (!isPrivileged) return <Navigate to="/" replace />;

	return (
		<>
			<PageHeader
				icon={<LuGraduationCap className="h-6 w-6" />}
				title="Proeflessen"
				subtitle="Plan en beheer proeflessen voor leerlingen"
			/>
			<div className="mt-4 mb-3 flex justify-end">
				<Button onClick={() => setOpenSchedule(true)}>
					<LuPlus className="h-4 w-4 mr-1" /> Proefles inplannen
				</Button>
			</div>
			<div className="mt-6">
				<DataTable
					title="Proeflessen"
					columns={columns}
					data={rows}
					loading={loading}
					getRowKey={(r) => r.id}
					emptyMessage="Nog geen proeflessen ingepland."
				/>
			</div>
			<ScheduleTrialLessonDialog open={openSchedule} onOpenChange={setOpenSchedule} onScheduled={load} />
		</>
	);
}
