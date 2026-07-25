import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { buildHoursReportRpcParams, parseHoursReportResult } from '@/lib/reports/reportDerivedData';
import type { ReportRow } from '@/types/reports';

interface UseReportsDataFetchParams {
	enabled: boolean;
	startDate: string;
	endDate: string;
	isPrivileged: boolean;
	selectedTeacherUserId: string;
}

export function useReportsDataFetch({
	enabled,
	startDate,
	endDate,
	isPrivileged,
	selectedTeacherUserId,
}: UseReportsDataFetchParams) {
	const [data, setData] = useState<ReportRow[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (!enabled || !startDate || !endDate) return;

		setLoading(true);
		const params = buildHoursReportRpcParams(startDate, endDate, isPrivileged, selectedTeacherUserId);

		void supabase.rpc('get_hours_report', params).then(({ data: result, error }) => {
			if (error) {
				console.error('Error loading report:', error);
				toast.error('Fout bij laden rapportage');
				setLoading(false);
				return;
			}
			setData(parseHoursReportResult(result));
			setLoading(false);
		});
	}, [enabled, startDate, endDate, isPrivileged, selectedTeacherUserId]);

	return { data, loading };
}
