import { addDaysFromNow, addYearsFromNow, formatDateToDb } from '@/lib/date/date-format';

export function wizardDefaultStartDate(): string {
	return formatDateToDb(addDaysFromNow(1));
}

export function wizardDefaultEndDate(): string {
	return formatDateToDb(addYearsFromNow(1));
}
