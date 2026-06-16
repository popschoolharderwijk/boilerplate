import { useEffect, useState } from 'react';
import { LuClock, LuFolderOpen, LuTrash2, LuUsers } from 'react-icons/lu';
import { Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import { PeriodPresetControls } from '@/components/reports/PeriodPresetControls';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, type DataTableColumn, type QuickFilterGroup } from '@/components/ui/data-table';
import { resolveIconFromList } from '@/components/ui/icon-picker';
import { Label } from '@/components/ui/label';
import { LessonTypeBadge } from '@/components/ui/lesson-type-badge';
import { PageHeader } from '@/components/ui/page-header';
import { PageSkeleton } from '@/components/ui/page-skeleton';
import { UserDisplay } from '@/components/ui/user-display';
import { UserSelectSingle } from '@/components/ui/user-select';
import { NAV_ICONS, NAV_LABELS } from '@/config/nav-labels';
import { MUSIC_ICONS } from '@/constants/icons';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { BASE_PRESET_LABELS, type BasePeriodPreset, getPresetDateRange } from '@/lib/reports/periodPresets';
import { formatDurationMinutes } from '@/lib/time/time-format';

const REPORT_PRESETS = Object.keys(BASE_PRESET_LABELS) as BasePeriodPreset[];

interface ReportRow {
	source_type: ReportSourceType;
	teacher_user_id: string;
	teacher_name: string;
	lesson_type_id: string | null;
	lesson_type_name: string | null;
	lesson_type_color: string | null;
	lesson_type_icon: string | null;
	age_category: 'under_21' | '21_plus' | 'unknown';
	total_minutes: number;
	lesson_count: number;
	duo_perspective: 'teacher_block' | 'student_lesson' | null;
	project_id: string | null;
	project_name: string | null;
}

type ReportSourceType = 'lesson' | 'project';

interface ReportLessonTypeOption {
	id: string;
	label: string;
	icon: string;
	color: string;
}

const DUO_PERSPECTIVE_LABELS: Record<'teacher_block' | 'student_lesson', string> = {
	teacher_block: 'docent-blokken',
	student_lesson: 'per leerling',
};

const AGE_LABELS: Record<string, string> = {
	under_21: 'Onder 21',
	'21_plus': '21+',
	unknown: 'Onbekend',
};

function buildReportColumns(isPrivileged: boolean): DataTableColumn<ReportRow>[] {
	const cols: DataTableColumn<ReportRow>[] = [];
	if (isPrivileged) {
		cols.push({
			key: 'teacher_name',
			label: 'Docent',
			sortable: true,
			sortValue: (r) => r.teacher_name.toLowerCase(),
			render: (row) => (
				<UserDisplay
					profile={{
						first_name: null,
						last_name: null,
						email: row.teacher_name,
						avatar_url: null,
					}}
				/>
			),
		});
	}
	cols.push(
		{
			key: 'category',
			label: 'Lessoort / Project',
			sortable: true,
			sortValue: (r) =>
				(r.source_type === 'project' ? (r.project_name ?? '') : (r.lesson_type_name ?? '')).toLowerCase(),
			render: (row) => {
				if (row.source_type === 'project') {
					return (
						<Badge variant="outline" className="gap-1">
							<LuFolderOpen className="h-3 w-3" />
							{row.project_name}
						</Badge>
					);
				}
				if (!row.lesson_type_name) return null;
				return (
					<div className="flex items-center gap-2">
						<LessonTypeBadge
							lessonType={{
								name: row.lesson_type_name,
								icon: row.lesson_type_icon ?? '',
								color: row.lesson_type_color ?? '',
							}}
							size="sm"
						/>
						{row.duo_perspective && (
							<span
								className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary"
								title={
									row.duo_perspective === 'teacher_block'
										? 'Duo: 1 lesblok per duo-paar, BTW gesplitst per leerling'
										: 'Duo: 2 leerling-lessen per duo-paar'
								}
							>
								{DUO_PERSPECTIVE_LABELS[row.duo_perspective]}
							</span>
						)}
					</div>
				);
			},
		},
		{
			key: 'age_category',
			label: 'Leeftijd',
			sortable: true,
			sortValue: (r) => r.age_category,
			render: (row) => {
				if (row.source_type === 'project') {
					return <span className="text-muted-foreground">—</span>;
				}
				const variant =
					row.age_category === 'under_21'
						? 'secondary'
						: row.age_category === '21_plus'
							? 'outline'
							: 'default';
				return <Badge variant={variant}>{AGE_LABELS[row.age_category]}</Badge>;
			},
		},
		{
			key: 'lesson_count',
			label: 'Aantal lessen',
			sortable: true,
			sortValue: (r) => r.lesson_count,
			className: 'text-right tabular-nums',
			render: (row) => <span className="tabular-nums">{row.lesson_count}</span>,
		},
		{
			key: 'total_minutes',
			label: 'Uren',
			sortable: true,
			sortValue: (r) => r.total_minutes,
			className: 'text-right tabular-nums',
			render: (row) => (
				<span className="font-medium tabular-nums">{formatDurationMinutes(row.total_minutes)}</span>
			),
		},
	);
	return cols;
}

function ReportsDataTable({
	data,
	isPrivileged,
	loading,
	tableSearchQuery,
	onTableSearchChange,
	tableLessonTypeId,
	onTableLessonTypeChange,
	tableAgeCategory,
	onTableAgeCategoryChange,
	tableSourceType,
	onTableSourceTypeChange,
	reportLessonTypeOptions,
}: {
	data: ReportRow[];
	isPrivileged: boolean;
	loading: boolean;
	tableSearchQuery: string;
	onTableSearchChange: (q: string) => void;
	tableLessonTypeId: string | null;
	onTableLessonTypeChange: (id: string | null) => void;
	tableAgeCategory: string | null;
	onTableAgeCategoryChange: (cat: string | null) => void;
	tableSourceType: string | null;
	onTableSourceTypeChange: (t: string | null) => void;
	reportLessonTypeOptions: ReportLessonTypeOption[];
}) {
	const columns = buildReportColumns(isPrivileged);

	const quickFilter: QuickFilterGroup[] = [
		{
			label: 'Type',
			value: tableSourceType,
			options: [
				{ id: 'lesson', label: 'Lessen' },
				{ id: 'project', label: 'Projecten' },
			],
			onChange: onTableSourceTypeChange,
			showAllOption: true,
			allOptionLabel: 'Alle',
		},
		{
			label: 'Lessoort',
			value: tableLessonTypeId,
			options: reportLessonTypeOptions.map((opt) => ({
				id: opt.id,
				label: opt.label,
				icon: opt.icon ? resolveIconFromList(MUSIC_ICONS, opt.icon) : undefined,
				color: opt.color,
			})),
			onChange: onTableLessonTypeChange,
			showAllOption: true,
			allOptionLabel: 'Alle',
		},
		{
			label: 'Leeftijd',
			value: tableAgeCategory,
			options: [
				{ id: 'under_21', label: 'Onder 21' },
				{ id: '21_plus', label: '21+' },
			],
			onChange: onTableAgeCategoryChange,
			showAllOption: true,
			allOptionLabel: 'Alle',
		},
	];

	return (
		<DataTable<ReportRow>
			title=""
			data={data}
			columns={columns}
			searchQuery={tableSearchQuery}
			onSearchChange={onTableSearchChange}
			searchPlaceholder="Zoeken op docent, lessoort of project..."
			searchFields={[
				(r) => r.teacher_name,
				(r) => r.lesson_type_name ?? '',
				(r) => r.project_name ?? '',
				(r) => AGE_LABELS[r.age_category],
			]}
			loading={loading}
			getRowKey={(row) =>
				row.source_type === 'project'
					? `project-${row.teacher_user_id}-${row.project_id}`
					: `lesson-${row.teacher_user_id}-${row.lesson_type_id}-${row.age_category}-${row.duo_perspective ?? 'std'}`
			}
			emptyMessage="Geen gegevens gevonden voor de geselecteerde periode en filters."
			initialSortColumn="total_minutes"
			initialSortDirection="desc"
			quickFilter={quickFilter}
			rowsPerPage={20}
			paginated={true}
		/>
	);
}

export default function Reports() {
	const { isPrivileged, isTeacher, isLoading: authLoading } = useAuth();
	const hasAccess = isPrivileged || isTeacher;

	const [preset, setPreset] = useState<BasePeriodPreset>('this_month');
	const initialDates = getPresetDateRange('this_month');
	const [startDate, setStartDate] = useState(initialDates.start);
	const [endDate, setEndDate] = useState(initialDates.end);

	const [selectedTeacherUserId, setSelectedTeacherUserId] = useState<string>('all');

	const [tableSearchQuery, setTableSearchQuery] = useState('');
	const [tableLessonTypeId, setTableLessonTypeId] = useState<string | null>(null);
	const [tableAgeCategory, setTableAgeCategory] = useState<string | null>(null);
	const [tableSourceType, setTableSourceType] = useState<string | null>(null);

	const [data, setData] = useState<ReportRow[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (authLoading || !hasAccess || !startDate || !endDate) return;

		setLoading(true);
		const params: { p_start_date: string; p_end_date: string; p_teacher_user_id?: string } = {
			p_start_date: startDate,
			p_end_date: endDate,
		};
		if (isPrivileged && selectedTeacherUserId !== 'all') {
			params.p_teacher_user_id = selectedTeacherUserId;
		}

		void supabase.rpc('get_hours_report', params).then(({ data: result, error }) => {
			if (error) {
				console.error('Error loading report:', error);
				toast.error('Fout bij laden rapportage');
				setLoading(false);
				return;
			}
			const parsed = result as unknown as { data: ReportRow[] };
			setData(parsed?.data || []);
			setLoading(false);
		});
	}, [authLoading, hasAccess, startDate, endDate, isPrivileged, selectedTeacherUserId]);

	const filteredData: ReportRow[] = [];
	for (const row of data) {
		if (tableSourceType != null && row.source_type !== tableSourceType) continue;
		if (tableLessonTypeId != null && row.lesson_type_id !== tableLessonTypeId) continue;
		if (tableAgeCategory != null && row.age_category !== tableAgeCategory) continue;
		filteredData.push(row);
	}

	const searchQuery = tableSearchQuery.trim().toLowerCase();
	const dataVisibleInTable: ReportRow[] = [];
	if (searchQuery === '') {
		for (const row of filteredData) dataVisibleInTable.push(row);
	} else {
		for (const row of filteredData) {
			const matchesSearch =
				row.teacher_name.toLowerCase().includes(searchQuery) ||
				(row.lesson_type_name ?? '').toLowerCase().includes(searchQuery) ||
				(row.project_name ?? '').toLowerCase().includes(searchQuery) ||
				AGE_LABELS[row.age_category].toLowerCase().includes(searchQuery);
			if (matchesSearch) dataVisibleInTable.push(row);
		}
	}

	const seenLessonTypes = new Set<string>();
	const reportLessonTypeOptions: ReportLessonTypeOption[] = [];
	for (const r of data) {
		if (r.source_type !== 'lesson' || !r.lesson_type_id) continue;
		if (seenLessonTypes.has(r.lesson_type_id)) continue;
		seenLessonTypes.add(r.lesson_type_id);
		reportLessonTypeOptions.push({
			id: r.lesson_type_id,
			label: r.lesson_type_name ?? '',
			icon: r.lesson_type_icon ?? '',
			color: r.lesson_type_color ?? '',
		});
	}

	let totalMinutes = 0;
	let totalLessons = 0;
	let under21Minutes = 0;
	let over21Minutes = 0;
	let projectMinutes = 0;
	for (const r of dataVisibleInTable) {
		if (r.duo_perspective === 'student_lesson') continue;
		totalMinutes += r.total_minutes;
		if (r.source_type === 'lesson') totalLessons += r.lesson_count;
		if (r.age_category === 'under_21') under21Minutes += r.total_minutes;
		if (r.age_category === '21_plus') over21Minutes += r.total_minutes;
		if (r.source_type === 'project') projectMinutes += r.total_minutes;
	}
	const summary = { totalMinutes, totalLessons, under21Minutes, over21Minutes, projectMinutes };

	if (!authLoading && !hasAccess) {
		return <Navigate to="/" replace />;
	}

	if (authLoading) {
		return <PageSkeleton variant="header-and-cards" />;
	}

	return (
		<div className="space-y-6">
			<PageHeader
				title={NAV_LABELS.reports}
				subtitle="Urenrapportage per docent, lessoort en leeftijdscategorie"
			/>

			<PeriodPresetControls
				preset={preset}
				presets={REPORT_PRESETS}
				labels={BASE_PRESET_LABELS}
				onPresetChange={(newPreset) => {
					setPreset(newPreset);
					if (newPreset !== 'custom') {
						const dates = getPresetDateRange(newPreset);
						setStartDate(dates.start);
						setEndDate(dates.end);
					}
				}}
				startDate={startDate}
				endDate={endDate}
				onStartDateChange={setStartDate}
				onEndDateChange={setEndDate}
			/>

			{isPrivileged && (
				<div className="flex flex-wrap items-end gap-4">
					<div className="space-y-1.5 min-w-[280px]">
						<Label>Docent</Label>
						<div className="flex items-center gap-2">
							<UserSelectSingle
								filter="teachers"
								value={selectedTeacherUserId === 'all' ? null : selectedTeacherUserId}
								onChange={(user) => setSelectedTeacherUserId(user?.user_id ?? 'all')}
								placeholder="Alle docenten"
							/>
							{selectedTeacherUserId !== 'all' && (
								<Button
									type="button"
									variant="outline"
									size="icon"
									onClick={() => setSelectedTeacherUserId('all')}
									className="h-10 w-10 flex-shrink-0"
									title="Selectie wissen"
								>
									<LuTrash2 className="h-4 w-4 text-muted-foreground" />
								</Button>
							)}
						</div>
					</div>
				</div>
			)}

			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
							<NAV_ICONS.reports className="h-4 w-4" />
							Totaal lessen
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{summary.totalLessons}</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
							<LuClock className="h-4 w-4" />
							Totaal uren
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{formatDurationMinutes(summary.totalMinutes)}</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
							<LuUsers className="h-4 w-4" />
							Uren onder 21
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{formatDurationMinutes(summary.under21Minutes)}</div>
						<p className="text-xs text-muted-foreground">Vrijgesteld van BTW</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
							<LuUsers className="h-4 w-4" />
							Uren 21+
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{formatDurationMinutes(summary.over21Minutes)}</div>
						<p className="text-xs text-muted-foreground">BTW-plichtig</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
							<LuFolderOpen className="h-4 w-4" />
							Project-uren
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{formatDurationMinutes(summary.projectMinutes)}</div>
					</CardContent>
				</Card>
			</div>

			{loading ? (
				<PageSkeleton variant="header-and-cards" />
			) : (
				<ReportsDataTable
					data={filteredData}
					isPrivileged={isPrivileged}
					loading={false}
					tableSearchQuery={tableSearchQuery}
					onTableSearchChange={setTableSearchQuery}
					tableLessonTypeId={tableLessonTypeId}
					onTableLessonTypeChange={setTableLessonTypeId}
					tableAgeCategory={tableAgeCategory}
					onTableAgeCategoryChange={setTableAgeCategory}
					tableSourceType={tableSourceType}
					onTableSourceTypeChange={setTableSourceType}
					reportLessonTypeOptions={reportLessonTypeOptions}
				/>
			)}
		</div>
	);
}
