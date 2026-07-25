import { parseISO } from 'date-fns';
import { formatDateToDb, getDateForDayOfWeek } from '../../../src/lib/date/date-format';

/** Date in the same week as originalDateStr with the same weekday as referenceDate (YYYY-MM-DD). */
export function getActualDateInOriginalWeek(originalDateStr: string, referenceDate: Date): string {
	const originalDate = parseISO(`${originalDateStr}T12:00:00`);
	const targetDayOfWeek = referenceDate.getDay();
	const actualDate = getDateForDayOfWeek(targetDayOfWeek, originalDate);
	return formatDateToDb(actualDate);
}
