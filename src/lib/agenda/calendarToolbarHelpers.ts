import type { ToolbarProps, View } from 'react-big-calendar';

const CALENDAR_VIEW_LABELS: Partial<Record<View, string>> = {
	month: 'Maand',
	week: 'Week',
	day: 'Dag',
	agenda: 'Agenda',
};

function viewsToArray(views: ToolbarProps['views']): View[] {
	if (Array.isArray(views)) return views;
	return (Object.keys(views) as View[]).filter((key) => views[key as keyof typeof views]);
}

export function resolveCalendarViewOptions(views: ToolbarProps['views']): View[] {
	return viewsToArray(views).filter((view) => view in CALENDAR_VIEW_LABELS);
}

export function resolveCalendarViewLabel(view: View, messages: ToolbarProps['localizer']['messages']): string {
	const localized = messages?.[view];
	if (typeof localized === 'string') return localized;
	return CALENDAR_VIEW_LABELS[view] ?? view;
}
