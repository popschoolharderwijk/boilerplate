import { useCallback, useEffect, useMemo, useState } from 'react';
import { LuCheck, LuInbox, LuX } from 'react-icons/lu';
import { Navigate, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { PageHeader } from '@/components/ui/page-header';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { formatDbDateLong } from '@/lib/date/date-format';

type Row = Tables<'lesson_signup_requests'> & {
	lesson_type_name: string | null;
	lesson_group_name: string | null;
	is_group_lesson: boolean;
};

export default function SignupRequests() {
	const { isPrivileged, isLoading } = useAuth();
	const navigate = useNavigate();
	const [rows, setRows] = useState<Row[]>([]);
	const [loading, setLoading] = useState(true);
	const [statusFilter, setStatusFilter] = useState<'pending' | 'all'>('pending');
	const [busyId, setBusyId] = useState<string | null>(null);

	const load = useCallback(async () => {
		setLoading(true);
		let q = supabase
			.from('lesson_signup_requests')
			.select('*, lesson_types(id, name, is_group_lesson), lesson_groups(id, name)')
			.order('created_at', { ascending: false });
		if (statusFilter === 'pending') q = q.eq('status', 'pending');
		const { data, error } = await q;
		setLoading(false);
		if (error) {
			toast.error('Fout bij laden aanmeldingen');
			return;
		}
		setRows(
			(data ?? []).map((r) => {
				const lt = Array.isArray(r.lesson_types) ? r.lesson_types[0] : r.lesson_types;
				const lg = Array.isArray(r.lesson_groups) ? r.lesson_groups[0] : r.lesson_groups;
				return {
					...(r as Tables<'lesson_signup_requests'>),
					lesson_type_name: lt?.name ?? null,
					lesson_group_name: lg?.name ?? null,
					is_group_lesson: lt?.is_group_lesson ?? false,
				};
			}),
		);
	}, [statusFilter]);

	useEffect(() => {
		if (isPrivileged) load();
	}, [isPrivileged, load]);

	const reject = useCallback(
		async (row: Row) => {
			if (!confirm('Aanmelding afwijzen?')) return;
			setBusyId(row.id);
			const { error } = await supabase
				.from('lesson_signup_requests')
				.update({ status: 'rejected', processed_at: new Date().toISOString() })
				.eq('id', row.id);
			setBusyId(null);
			if (error) {
				toast.error('Kon niet afwijzen');
				return;
			}
			toast.success('Aanmelding afgewezen');
			load();
		},
		[load],
	);

	const process = useCallback(
		async (row: Row) => {
			setBusyId(row.id);
			// For group requests we approve via edge function (creates user/student/membership)
			if (row.is_group_lesson && row.lesson_group_id) {
				const { data, error } = await supabase.functions.invoke('approve-signup-request', {
					body: { request_id: row.id },
				});
				setBusyId(null);
				if (error || (data as { error?: string })?.error) {
					toast.error((data as { error?: string })?.error ?? error?.message ?? 'Fout bij verwerken');
					return;
				}
				toast.success('Aanmelding verwerkt');
				load();
				return;
			}
			// For individual / waitlist: create user via edge function then open AgreementWizard
			const { data, error } = await supabase.functions.invoke('approve-signup-request', {
				body: { request_id: row.id },
			});
			setBusyId(null);
			if (error || (data as { error?: string })?.error) {
				toast.error((data as { error?: string })?.error ?? error?.message ?? 'Fout bij verwerken');
				return;
			}
			const studentUserId = (data as { student_user_id?: string })?.student_user_id;
			navigate(
				`/agreements/new?fromRequest=${row.id}&studentUserId=${studentUserId}&lessonTypeId=${row.lesson_type_id}`,
			);
		},
		[load, navigate],
	);

	const columns: DataTableColumn<Row>[] = useMemo(
		() => [
			{
				key: 'created_at',
				label: 'Ontvangen',
				render: (r) => <span className="text-sm">{formatDbDateLong(r.created_at)}</span>,
			},
			{
				key: 'name',
				label: 'Aanmelder',
				render: (r) => (
					<div>
						<div className="font-medium">
							{r.first_name} {r.last_name}
						</div>
						<div className="text-xs text-muted-foreground">{r.email}</div>
					</div>
				),
			},
			{
				key: 'type',
				label: 'Lessoort',
				render: (r) => (
					<div>
						<div>{r.lesson_type_name}</div>
						{r.lesson_group_name ? (
							<div className="text-xs text-muted-foreground">Groep: {r.lesson_group_name}</div>
						) : r.is_group_lesson ? (
							<Badge variant="outline">Wachtlijst</Badge>
						) : null}
					</div>
				),
			},
			{
				key: 'status',
				label: 'Status',
				render: (r) => (
					<Badge
						variant={r.status === 'pending' ? 'default' : r.status === 'approved' ? 'secondary' : 'outline'}
					>
						{r.status}
					</Badge>
				),
			},
			{
				key: 'actions',
				label: '',
				render: (r) =>
					r.status === 'pending' ? (
						<div className="flex gap-2 justify-end">
							<Button size="sm" variant="outline" onClick={() => reject(r)} disabled={busyId === r.id}>
								<LuX className="h-4 w-4" />
							</Button>
							<Button size="sm" onClick={() => process(r)} disabled={busyId === r.id}>
								<LuCheck className="h-4 w-4 mr-1" /> Verwerken
							</Button>
						</div>
					) : null,
			},
		],
		[busyId, process, reject],
	);

	if (isLoading) return null;
	if (!isPrivileged) return <Navigate to="/" replace />;

	return (
		<>
			<PageHeader
				icon={<LuInbox className="h-6 w-6" />}
				title="Aanmeldingen"
				subtitle="Publieke aanmeldingen verwerken"
			/>
			<div className="mt-6 flex gap-2 mb-3">
				<Button
					size="sm"
					variant={statusFilter === 'pending' ? 'default' : 'outline'}
					onClick={() => setStatusFilter('pending')}
				>
					Open
				</Button>
				<Button
					size="sm"
					variant={statusFilter === 'all' ? 'default' : 'outline'}
					onClick={() => setStatusFilter('all')}
				>
					Alle
				</Button>
			</div>
			<DataTable title="Aanmeldingen" columns={columns} data={rows} loading={loading} getRowKey={(r) => r.id} />
		</>
	);
}
