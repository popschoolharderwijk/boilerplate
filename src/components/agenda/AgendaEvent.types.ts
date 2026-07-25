import type { ReactNode } from 'react';
import type { CalendarEvent } from './types';

export interface AgendaEventProps {
	event: CalendarEvent;
	title: ReactNode;
}
