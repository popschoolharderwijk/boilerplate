import { useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useReportsDataFetch } from '@/hooks/useReportsDataFetch';
import { type BasePeriodPreset, getPresetDateRange } from '@/lib/reports/periodPresets';
import {
	applyReportSearch,
	buildReportLessonTypeOptions,
	computeReportSummary,
	filterReportRows,
} from '@/lib/reports/reportDerivedData';

const INITIAL_DATES = getPresetDateRange('this_month');

function useReportsPeriodState() {
	const [preset, setPreset] = useState<BasePeriodPreset>('this_month');
	const [startDate, setStartDate] = useState(INITIAL_DATES.start);
	const [endDate, setEndDate] = useState(INITIAL_DATES.end);

	const handlePresetChange = (newPreset: BasePeriodPreset) => {
		setPreset(newPreset);
		if (newPreset !== 'custom') {
			const dates = getPresetDateRange(newPreset);
			setStartDate(dates.start);
			setEndDate(dates.end);
		}
	};

	return { preset, startDate, endDate, setStartDate, setEndDate, handlePresetChange };
}

function useReportsTableFilters() {
	const [tableSearchQuery, setTableSearchQuery] = useState('');
	const [tableLessonTypeId, setTableLessonTypeId] = useState<string | null>(null);
	const [tableAgeCategory, setTableAgeCategory] = useState<string | null>(null);
	const [tableSourceType, setTableSourceType] = useState<string | null>(null);

	return {
		tableSearchQuery,
		setTableSearchQuery,
		tableLessonTypeId,
		setTableLessonTypeId,
		tableAgeCategory,
		setTableAgeCategory,
		tableSourceType,
		setTableSourceType,
	};
}

export function useReportsPage() {
	const { isPrivileged, isTeacher, isLoading: authLoading } = useAuth();
	const hasAccess = isPrivileged || isTeacher;
	const [selectedTeacherUserId, setSelectedTeacherUserId] = useState<string>('all');
	const period = useReportsPeriodState();
	const tableFilters = useReportsTableFilters();

	const { data, loading } = useReportsDataFetch({
		enabled: !authLoading && hasAccess,
		startDate: period.startDate,
		endDate: period.endDate,
		isPrivileged,
		selectedTeacherUserId,
	});

	const quickFilters = useMemo(
		() => ({
			sourceType: tableFilters.tableSourceType,
			lessonTypeId: tableFilters.tableLessonTypeId,
			ageCategory: tableFilters.tableAgeCategory,
		}),
		[tableFilters.tableSourceType, tableFilters.tableLessonTypeId, tableFilters.tableAgeCategory],
	);

	const filteredData = useMemo(() => filterReportRows(data, quickFilters), [data, quickFilters]);
	const dataVisibleInTable = useMemo(
		() => applyReportSearch(filteredData, tableFilters.tableSearchQuery),
		[filteredData, tableFilters.tableSearchQuery],
	);
	const reportLessonTypeOptions = useMemo(() => buildReportLessonTypeOptions(data), [data]);
	const summary = useMemo(() => computeReportSummary(dataVisibleInTable), [dataVisibleInTable]);

	return {
		authLoading,
		hasAccess,
		isPrivileged,
		selectedTeacherUserId,
		setSelectedTeacherUserId,
		filteredData,
		reportLessonTypeOptions,
		summary,
		loading,
		...period,
		...tableFilters,
	};
}
