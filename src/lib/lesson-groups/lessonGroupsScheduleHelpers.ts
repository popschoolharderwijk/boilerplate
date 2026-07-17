import { addDaysToDateStr } from '@/lib/date/date-format';

export function computeLessonGroupEndTime(startTime: string, durationMinutes: number): string {
	const [hours, minutes] = startTime.split(':').map(Number);
	const totalMinutes = hours * 60 + (minutes ?? 0) + durationMinutes;
	const endHours = Math.floor(totalMinutes / 60) % 24;
	const endMinutes = totalMinutes % 60;
	return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}:00`;
}

export function computeLessonGroupFirstDate(startDate: string, dayOfWeek: number): string {
	const start = new Date(`${startDate}T12:00:00`);
	const offset = (dayOfWeek - start.getDay() + 7) % 7;
	return addDaysToDateStr(startDate, offset);
}
