import { useCallback, useEffect, useState } from 'react';
import { LuCreditCard } from 'react-icons/lu';
import { Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { PageHeader } from '@/components/ui/page-header';
import { UserDisplay } from '@/components/ui/user-display';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { formatDbDateToUi } from '@/lib/date/date-format';
import {
	SUBSCRIPTION_STATUS_LABELS,
	SUBSCRIPTION_STATUS_VARIANTS,
	type SubscriptionRow,
	type SubscriptionStatus,
} from '@/types/subscriptions';

interface Row extends SubscriptionRow {
	lesson_agreement: {
		id: string;
		student_user_id: string;
		teacher_user_id: string;
		profiles: {
			first_name: string | null;
			last_name: string | null;
			email: string;
			avatar_url: string | null;
		} | null;
	} | null;
}

export default function Subscriptions() {
	const { isPrivileged, isLoading } = useAuth();
	const [rows, setRows] = useState<Row[]>([]);
	const [loading, setLoading] = useState(true);

	const load = useCallback(async () => {
		setLoading(true);
		const { data, error } = await supabase
			.from('subscriptions')
			.select(
				`*, lesson_agreement:lesson_agreements!inner(
					id, student_user_id, teacher_user_id,
					profiles!lesson_agreements_student_user_id_fkey(first_name, last_name, email, avatar_url)
				)`,
			)
			.order('created_at', { ascending: false });
		setLoading(false);
		if (error) {
			// Fallback to a simpler query — explicit join hint may differ
			const { data: simple } = await supabase
				.from('subscriptions')
				.select('*')
				.order('created_at', { ascending: false });
			setRows((simple ?? []).map((s) => ({ ...s, lesson_agreement: null })) as Row[]);
			toast.error('Kon leerlinginfo niet laden');
			return;
		}
		setRows((data ?? []) as Row[]);
	}, []);

	useEffect(() => {
		if (isPrivileged) void load();
	}, [isPrivileged, load]);

	if (isLoading) return null;
	if (!isPrivileged) return <Navigate to="/" replace />;

	const columns: DataTableColumn<Row>[] = [
		{
			key: 'student',
			label: 'Leerling',
			render: (row) =>
				row.lesson_agreement?.profiles ? (
					<UserDisplay profile={row.lesson_agreement.profiles} showEmail />
				) : (
					<span className="text-muted-foreground">—</span>
				),
		},
		{
			key: 'status',
			label: 'Status',
			render: (row) => {
				const status = row.status as SubscriptionStatus;
				return (
					<Badge variant={SUBSCRIPTION_STATUS_VARIANTS[status]}>{SUBSCRIPTION_STATUS_LABELS[status]}</Badge>
				);
			},
		},
		{
			key: 'period',
			label: 'Huidige periode',
			render: (row) =>
				row.current_period_end ? (
					<span className="text-sm text-muted-foreground">
						tot {formatDbDateToUi(row.current_period_end.split('T')[0])}
					</span>
				) : (
					'—'
				),
		},
		{
			key: 'method',
			label: 'Betaalmethode',
			render: (row) =>
				row.default_payment_method_brand ? (
					<span className="text-sm">{row.default_payment_method_brand.replace('_', ' ')}</span>
				) : (
					'—'
				),
		},
	];

	return (
		<div className="space-y-6">
			<PageHeader
				icon={<LuCreditCard className="h-6 w-6" />}
				title="Abonnementen"
				subtitle="Stripe incasso's per lesovereenkomst"
			/>
			<DataTable<Row>
				title="Abonnementen"
				data={rows}
				columns={columns}
				loading={loading}
				getRowKey={(r) => r.id}
				emptyMessage="Nog geen abonnementen."
			/>
		</div>
	);
}
