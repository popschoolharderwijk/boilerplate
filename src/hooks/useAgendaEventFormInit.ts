import { useEffect, useState } from 'react';
import {
	buildCreateFormSeedValues,
	buildEditFormSeedValues,
	type OccurrenceOverrides,
} from '@/lib/agenda/agendaEventFormHelpers';
import type { AgendaEventRow } from '@/types/agenda-events';
import type { LessonFrequency } from '@/types/lesson-agreements';

interface UseAgendaEventFormInitOptions {
	open: boolean;
	event: AgendaEventRow | null | undefined;
	initialSlot: { start: Date; end: Date } | null | undefined;
	userId: string | undefined;
	occurrenceDate?: string | null;
	occurrenceStartTime?: string | null;
	occurrenceEndTime?: string | null;
	occurrenceOverrides?: OccurrenceOverrides | null;
	setParticipantIds: (value: string[]) => void;
	setInitialParticipantIds: (value: string[]) => void;
}

export function useAgendaEventFormInit({
	open,
	event,
	initialSlot,
	userId,
	occurrenceDate,
	occurrenceStartTime,
	occurrenceEndTime,
	occurrenceOverrides,
	setParticipantIds,
	setInitialParticipantIds,
}: UseAgendaEventFormInitOptions) {
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [startDate, setStartDate] = useState<string | null>(null);
	const [startTime, setStartTime] = useState('09:00');
	const [endDate, setEndDate] = useState<string | null>(null);
	const [endTime, setEndTime] = useState('10:00');
	const [isAllDay, setIsAllDay] = useState(false);
	const [recurring, setRecurring] = useState(false);
	const [recurringFrequency, setRecurringFrequency] = useState<LessonFrequency>('weekly');
	const [recurringEndDate, setRecurringEndDate] = useState<string | null>(null);
	const [color, setColor] = useState<string | null>(null);
	const [showDescription, setShowDescription] = useState(false);

	useEffect(() => {
		if (!open) return;

		if (event) {
			const seed = buildEditFormSeedValues(
				event,
				occurrenceDate,
				occurrenceStartTime,
				occurrenceEndTime,
				occurrenceOverrides,
			);
			setTitle(seed.title);
			setDescription(seed.description);
			setShowDescription(seed.showDescription);
			setStartDate(seed.startDate);
			setStartTime(seed.startTime);
			setEndDate(seed.endDate);
			setEndTime(seed.endTime);
			setIsAllDay(seed.isAllDay);
			setRecurring(seed.recurring);
			setRecurringFrequency(seed.recurringFrequency);
			setRecurringEndDate(seed.recurringEndDate);
			setColor(seed.color);
			return;
		}

		const seed = buildCreateFormSeedValues(initialSlot, userId);
		setStartDate(seed.startDate);
		setStartTime(seed.startTime);
		setEndDate(seed.endDate);
		setEndTime(seed.endTime);
		setTitle('');
		setDescription('');
		setShowDescription(false);
		setIsAllDay(false);
		setRecurring(false);
		setRecurringFrequency('weekly');
		setRecurringEndDate(null);
		setColor(null);
		setParticipantIds(seed.participantIds);
		setInitialParticipantIds([]);
	}, [
		open,
		event,
		userId,
		initialSlot,
		occurrenceDate,
		occurrenceStartTime,
		occurrenceEndTime,
		occurrenceOverrides,
		setParticipantIds,
		setInitialParticipantIds,
	]);

	return {
		title,
		setTitle,
		description,
		setDescription,
		startDate,
		setStartDate,
		startTime,
		setStartTime,
		endDate,
		setEndDate,
		endTime,
		setEndTime,
		isAllDay,
		setIsAllDay,
		recurring,
		setRecurring,
		recurringFrequency,
		setRecurringFrequency,
		recurringEndDate,
		setRecurringEndDate,
		color,
		setColor,
		showDescription,
		setShowDescription,
	};
}
