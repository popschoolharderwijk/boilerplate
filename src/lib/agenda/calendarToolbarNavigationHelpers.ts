export const CALENDAR_NAVIGATE = { PREVIOUS: 'PREV', NEXT: 'NEXT', TODAY: 'TODAY' } as const;

export type CalendarNavigateAction = (typeof CALENDAR_NAVIGATE)[keyof typeof CALENDAR_NAVIGATE];

export function resolveCalendarTodayLabel(messagesToday: unknown): string {
	return typeof messagesToday === 'string' ? messagesToday : 'Vandaag';
}

export function resolveCalendarNavAriaLabel(messagesLabel: unknown, fallback: string): string {
	return String(messagesLabel ?? fallback);
}
