import { addDaysFromNow, addYearsFromNow, formatDateToDb } from '@/lib/date/date-format';

export function lessonGroupDefaultStartDate(): string {
	return formatDateToDb(addDaysFromNow(1));
}

export function lessonGroupDefaultEndDate(): string {
	return formatDateToDb(addYearsFromNow(1));
}
