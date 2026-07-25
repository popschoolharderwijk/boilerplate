import type { ToolbarProps, View } from 'react-big-calendar';
import { LuChevronLeft, LuChevronRight } from 'react-icons/lu';
import { resolveCalendarViewLabel } from '@/lib/agenda/calendarToolbarHelpers';
import {
	CALENDAR_NAVIGATE,
	resolveCalendarNavAriaLabel,
	resolveCalendarTodayLabel,
} from '@/lib/agenda/calendarToolbarNavigationHelpers';

interface CalendarToolbarNavigationProps {
	label: string;
	messages: ToolbarProps['localizer']['messages'];
	onNavigate: ToolbarProps['onNavigate'];
}

export function CalendarToolbarNavigation({ label, messages, onNavigate }: CalendarToolbarNavigationProps) {
	const todayLabel = resolveCalendarTodayLabel(messages?.today);
	const previousLabel = resolveCalendarNavAriaLabel(messages?.previous, 'Vorige');
	const nextLabel = resolveCalendarNavAriaLabel(messages?.next, 'Volgende');

	return (
		<span className="rbc-btn-group rbc-nav-group">
			<button type="button" onClick={() => onNavigate(CALENDAR_NAVIGATE.TODAY)}>
				{todayLabel}
			</button>
			<button
				type="button"
				className="rbc-nav-prev"
				onClick={() => onNavigate(CALENDAR_NAVIGATE.PREVIOUS)}
				aria-label={previousLabel}
			>
				<LuChevronLeft className="h-5 w-5" />
			</button>
			<button
				type="button"
				className="rbc-nav-next"
				onClick={() => onNavigate(CALENDAR_NAVIGATE.NEXT)}
				aria-label={nextLabel}
			>
				<LuChevronRight className="h-5 w-5" />
			</button>
			<span className="rbc-toolbar-label">{label}</span>
		</span>
	);
}

interface CalendarToolbarViewSelectProps {
	view: View;
	viewOptions: View[];
	messages: ToolbarProps['localizer']['messages'];
	onView: ToolbarProps['onView'];
}

export function CalendarToolbarViewSelect({ view, viewOptions, messages, onView }: CalendarToolbarViewSelectProps) {
	if (viewOptions.length <= 1) return null;

	return (
		<span className="rbc-btn-group">
			<select
				value={view}
				onChange={(event) => onView(event.target.value as View)}
				className="h-8 min-w-[5rem] cursor-pointer rounded border border-input bg-background pl-2 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
				aria-label="Weergave"
			>
				{viewOptions.map((viewOption) => (
					<option key={viewOption} value={viewOption}>
						{resolveCalendarViewLabel(viewOption, messages)}
					</option>
				))}
			</select>
		</span>
	);
}
