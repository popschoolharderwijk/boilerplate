import { formatDateToDb } from '@/lib/date/date-format';

export interface NoLessonPeriod {
	start_date: string;
	end_date: string;
	name?: string | null;
}

export function findNoLessonPeriod(date: Date, periods: NoLessonPeriod[] | undefined): NoLessonPeriod | undefined {
	if (!periods?.length) return undefined;
	const dateStr = formatDateToDb(date);
	return periods.find((p) => p.start_date <= dateStr && dateStr <= p.end_date);
}
