import { useCallback, useEffect, useMemo, useState } from 'react';
import { LuCalendar, LuCreditCard, LuExternalLink } from 'react-icons/lu';
import { Link, Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { PageHeader } from '@/components/ui/page-header';
import { UserDisplay } from '@/components/ui/user-display';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { pickAgeTariff, pickPriceCents } from '@/lib/billing/ageTariff';
import { calculateYearlyAmount } from '@/lib/billing/calculateYearlyAmount';
import { clampToSchoolYear, getSchoolYearForDateString } from '@/lib/billing/schoolYear';
import { formatDbDateToUi } from '@/lib/date/date-format';
import type { LessonFrequency } from '@/types/lesson-agreements';
import {
	SUBSCRIPTION_STATUS_LABELS,
	SUBSCRIPTION_STATUS_VARIANTS,
	type SubscriptionRow,
	type SubscriptionStatus,
} from '@/types/subscriptions';

const formatEuro = (cents: number) =>
	new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(cents / 100);

interface AgreementInfo {
	id: string;
	student_user_id: string;
	teacher_user_id: string;
	lesson_type_id: string;
	frequency: LessonFrequency;
	duration_minutes: number;
	day_of_week: number;
	start_date: string;
	end_date: string | null;
	profiles: {
		first_name: string | null;
		last_name: string | null;
		email: string;
		avatar_url: string | null;
	} | null;
}

interface Row extends SubscriptionRow {
	lesson_agreement: AgreementInfo | null;
}

interface BillingInfo {
	monthlyCents: number;
	lessonsCount: number;
	schoolYearLabel: string;
	tariff: 'under_21' | 'adult';
	error?: string;
}

export default function Subscriptions() {
	const { isPrivileged, isLoading } = useAuth();
	const [rows, setRows] = useState<Row[]>([]);
	const [billing, setBilling] = useState<Map<string, BillingInfo>>(new Map());
	const [loading, setLoading] = useState(true);

	const load = useCallback(async () => {
		setLoading(true);
		const { data, error } = await supabase
			.from('subscriptions')
			.select(
				`*, lesson_agreement:lesson_agreements!inner(
					id, student_user_id, teacher_user_id, lesson_type_id, frequency,
					duration_minutes, day_of_week, start_date, end_date,
					profiles!lesson_agreements_student_user_id_fkey(first_name, last_name, email, avatar_url)
				)`,
			)
			.order('created_at', { ascending: false });

		if (error) {
			setLoading(false);
			toast.error('Kon abonnementen niet laden');
			return;
		}

		const subs = (data ?? []) as Row[];
		setRows(subs);

		// Batch helpers
		const studentIds = Array.from(
			new Set(subs.map((s) => s.lesson_agreement?.student_user_id).filter((v): v is string => !!v)),
		);
		const lessonTypeIds = Array.from(
			new Set(subs.map((s) => s.lesson_agreement?.lesson_type_id).filter((v): v is string => !!v)),
		);

		const [{ data: students }, { data: options }, { data: holidays }] = await Promise.all([
			studentIds.length
				? supabase.from('students').select('user_id, date_of_birth').in('user_id', studentIds)
				: Promise.resolve({ data: [] as Array<{ user_id: string; date_of_birth: string | null }> }),
			lessonTypeIds.length
				? supabase
						.from('lesson_type_options')
						.select(
							'lesson_type_id, frequency, duration_minutes, price_per_lesson_under_21_cents, price_per_lesson_adult_cents',
						)
						.in('lesson_type_id', lessonTypeIds)
				: Promise.resolve({
						data: [] as Array<{
							lesson_type_id: string;
							frequency: LessonFrequency;
							duration_minutes: number;
							price_per_lesson_under_21_cents: number | null;
							price_per_lesson_adult_cents: number | null;
						}>,
					}),
			supabase.from('no_lesson_periods').select('start_date, end_date'),
		]);

		const dobByUser = new Map((students ?? []).map((s) => [s.user_id, s.date_of_birth]));
		const optionKey = (lt: string, f: string, d: number) => `${lt}|${f}|${d}`;
		const optionsMap = new Map(
			(options ?? []).map((o) => [optionKey(o.lesson_type_id, o.frequency, o.duration_minutes), o]),
		);
		const noLesson = holidays ?? [];

		const today = new Date().toISOString().slice(0, 10);
		const next = new Map<string, BillingInfo>();
		for (const sub of subs) {
			const a = sub.lesson_agreement;
			if (!a) continue;
			const refDate = a.start_date > today ? a.start_date : today;
			const sy = getSchoolYearForDateString(refDate);
			const win = clampToSchoolYear(sy, a.start_date, a.end_date);
			if (!win) continue;
			const opt = optionsMap.get(optionKey(a.lesson_type_id, a.frequency, a.duration_minutes));
			if (!opt) {
				next.set(sub.id, {
					monthlyCents: 0,
					lessonsCount: 0,
					schoolYearLabel: `${sy.startYear}/${sy.startYear + 1}`,
					tariff: 'adult',
					error: 'Geen prijs ingesteld',
				});
				continue;
			}
			const tariff = pickAgeTariff(dobByUser.get(a.student_user_id) ?? null, win.start);
			const price = pickPriceCents(opt, tariff) ?? 0;
			const result = calculateYearlyAmount({
				periodStart: win.start,
				periodEnd: win.end,
				dayOfWeek: a.day_of_week,
				frequency: a.frequency,
				pricePerLessonCents: price,
				noLessonPeriods: noLesson,
			});
			next.set(sub.id, {
				monthlyCents: result.monthlyCents,
				lessonsCount: result.lessonsCount,
				schoolYearLabel: `${sy.startYear}/${sy.startYear + 1}`,
				tariff,
				error: price <= 0 ? 'Geen tarief' : undefined,
			});
		}
		setBilling(next);
		setLoading(false);
	}, []);

	useEffect(() => {
		if (isPrivileged) void load();
	}, [isPrivileged, load]);

	const columns: DataTableColumn<Row>[] = useMemo(
		() => [
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
						<div className="flex flex-col gap-1">
							<Badge variant={SUBSCRIPTION_STATUS_VARIANTS[status]}>
								{SUBSCRIPTION_STATUS_LABELS[status]}
							</Badge>
							{row.stripe_schedule_id ? (
								<Badge variant="secondary" className="w-fit gap-1">
									<LuCalendar className="h-3 w-3" /> Schedule
								</Badge>
							) : null}
						</div>
					);
				},
			},
			{
				key: 'monthly',
				label: 'Maandbedrag',
				render: (row) => {
					const b = billing.get(row.id);
					if (!b) return <span className="text-muted-foreground">—</span>;
					if (b.error) return <span className="text-sm text-destructive">{b.error}</span>;
					return (
						<div className="flex flex-col">
							<span className="font-medium">{formatEuro(b.monthlyCents)}</span>
							<span className="text-xs text-muted-foreground">
								{b.lessonsCount} lessen · {b.tariff === 'under_21' ? '<21' : '21+'}
							</span>
						</div>
					);
				},
			},
			{
				key: 'schoolyear',
				label: 'Schooljaar',
				render: (row) => {
					const b = billing.get(row.id);
					return b ? <span className="text-sm">{b.schoolYearLabel}</span> : '—';
				},
			},
			{
				key: 'period',
				label: 'Volgende incasso',
				render: (row) =>
					row.current_period_end ? (
						<span className="text-sm text-muted-foreground">
							{formatDbDateToUi(row.current_period_end.split('T')[0])}
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
			{
				key: 'actions',
				label: '',
				render: (row) =>
					row.lesson_agreement ? (
						<Button asChild variant="ghost" size="sm">
							<Link to={`/agreements/${row.lesson_agreement.id}`}>
								<LuExternalLink className="h-4 w-4" />
							</Link>
						</Button>
					) : null,
			},
		],
		[billing],
	);

	if (isLoading) return null;
	if (!isPrivileged) return <Navigate to="/" replace />;

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
