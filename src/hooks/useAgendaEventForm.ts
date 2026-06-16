import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { RecurrenceScope } from '@/components/agenda/RecurrenceChoiceDialog';
import { supabase } from '@/integrations/supabase/client';
import { formatAgendaEventSaveError, saveAgendaEventForm } from '@/lib/agenda/agendaEventFormSave';
import { formatDateToDb, now } from '@/lib/date/date-format';
import { formatTime, formatTimeFromDate, normalizeTime } from '@/lib/time/time-format';
import type { AgendaEventRow, AgendaEventSourceType } from '@/types/agenda-events';
import type { LessonFrequency } from '@/types/lesson-agreements';

/** Overrides from a deviation for a single occurrence (title/description/color). Null means use base event. */
export interface OccurrenceOverrides {
	title: string | null;
	description: string | null;
	color: string | null;
}

export interface UseAgendaEventFormOptions {
	open: boolean;
	event: AgendaEventRow | null | undefined;
	initialSlot: { start: Date; end: Date } | null | undefined;
	userId: string | undefined;
	occurrenceDate?: string | null;
	occurrenceStartTime?: string | null;
	occurrenceEndTime?: string | null;
	occurrenceParticipantIds?: string[] | null;
	/** When editing one occurrence that has a deviation, pass its title/description/color so the form shows them */
	occurrenceOverrides?: OccurrenceOverrides | null;
	readonlyParticipantIds?: string[];
	/** When creating a project event, pass source info */
	sourceType?: AgendaEventSourceType;
	sourceId?: string | null;
	onSuccess?: () => void;
	onOpenChange: (open: boolean) => void;
}

interface ParticipantProfile {
	first_name: string | null;
	last_name: string | null;
	email: string | null;
}

/** Comparable snapshot of form fields for dirty-checking. */
interface FormSnapshot {
	title: string;
	description: string;
	startDate: string;
	startTime: string;
	endDate: string;
	endTime: string;
	isAllDay: boolean;
	recurring: boolean;
	recurringFrequency: string;
	recurringEndDate: string | null;
	color: string | null;
	participantIds: string[];
}

export function useAgendaEventForm({
	open,
	event,
	initialSlot,
	userId,
	occurrenceDate,
	occurrenceStartTime,
	occurrenceEndTime,
	occurrenceParticipantIds,
	occurrenceOverrides,
	readonlyParticipantIds = [],
	sourceType: externalSourceType,
	sourceId: externalSourceId,
	onSuccess,
	onOpenChange,
}: UseAgendaEventFormOptions) {
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
	const [participantIds, setParticipantIds] = useState<string[]>([]);
	const [initialParticipantIds, setInitialParticipantIds] = useState<string[]>([]);
	const [participantAddId, setParticipantAddId] = useState<string | null>(null);
	const [participantProfiles, setParticipantProfiles] = useState<Record<string, ParticipantProfile>>({});
	const [showDescription, setShowDescription] = useState(false);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		if (!open) return;
		if (event) {
			const titleValue = occurrenceOverrides ? (occurrenceOverrides.title ?? event.title) : event.title;
			const descriptionValue = occurrenceOverrides
				? (occurrenceOverrides.description ?? event.description ?? '')
				: (event.description ?? '');
			const colorValue = occurrenceOverrides ? (occurrenceOverrides.color ?? event.color ?? null) : event.color;
			setTitle(titleValue);
			setDescription(descriptionValue);
			setShowDescription(!!descriptionValue);
			setStartDate(occurrenceDate ?? event.start_date);
			setStartTime((occurrenceStartTime ?? event.start_time).substring(0, 5));
			setEndDate(occurrenceDate ?? event.end_date ?? event.start_date);
			setEndTime((occurrenceEndTime ?? event.end_time)?.substring(0, 5) ?? '10:00');
			setIsAllDay(event.is_all_day);
			setRecurring(event.recurring);
			setRecurringFrequency((event.recurring_frequency as LessonFrequency) ?? 'weekly');
			setRecurringEndDate(event.recurring_end_date);
			setColor(colorValue);
		} else {
			const today = formatDateToDb(now());
			if (initialSlot) {
				setStartDate(formatDateToDb(initialSlot.start));
				setStartTime(formatTimeFromDate(initialSlot.start));
				setEndDate(formatDateToDb(initialSlot.end));
				setEndTime(formatTimeFromDate(initialSlot.end));
			} else {
				setStartDate(today);
				setStartTime('09:00');
				setEndDate(today);
				setEndTime('10:00');
			}
			setTitle('');
			setDescription('');
			setShowDescription(false);
			setIsAllDay(false);
			setRecurring(false);
			setRecurringFrequency('weekly');
			setRecurringEndDate(null);
			setColor(null);
			setParticipantIds(userId ? [userId] : []);
			setInitialParticipantIds([]);
		}
	}, [open, event, userId, initialSlot, occurrenceDate, occurrenceStartTime, occurrenceEndTime, occurrenceOverrides]);

	useEffect(() => {
		const eventId = event?.id;
		if (!open || !eventId) return;
		if (occurrenceParticipantIds && occurrenceParticipantIds.length > 0) {
			setParticipantIds(occurrenceParticipantIds);
			setInitialParticipantIds(occurrenceParticipantIds);
			return;
		}
		async function loadParticipants() {
			const { data } = await supabase.from('agenda_participants').select('user_id').eq('event_id', eventId);
			if (data) {
				const ids = data.map((p) => p.user_id);
				setParticipantIds(ids);
				setInitialParticipantIds(ids);
			}
		}
		loadParticipants();
	}, [open, event?.id, occurrenceParticipantIds]);

	useEffect(() => {
		if (!open || participantIds.length === 0) {
			setParticipantProfiles({});
			return;
		}
		async function loadProfiles() {
			const { data } = await supabase
				.from('profiles')
				.select('user_id, first_name, last_name, email')
				.in('user_id', participantIds);
			const map: Record<string, ParticipantProfile> = {};
			for (const row of data ?? []) {
				map[row.user_id] = {
					first_name: row.first_name ?? null,
					last_name: row.last_name ?? null,
					email: row.email ?? null,
				};
			}
			setParticipantProfiles(map);
		}
		loadProfiles();
	}, [open, participantIds]);

	const handleAddParticipant = useCallback(
		(newUserId: string | null) => {
			if (!newUserId || participantIds.includes(newUserId)) return;
			setParticipantIds((prev) => [...prev, newUserId]);
			setParticipantAddId(null);
		},
		[participantIds],
	);

	const handleRemoveParticipant = useCallback(
		(removeUserId: string) => {
			if (readonlyParticipantIds.includes(removeUserId)) return;
			setParticipantIds((prev) => prev.filter((id) => id !== removeUserId));
		},
		[readonlyParticipantIds],
	);

	const initialSnapshot = useMemo((): FormSnapshot | null => {
		if (!event) return null;
		const origStart = (occurrenceStartTime ?? event.start_time).toString();
		const origEnd = (occurrenceEndTime ?? event.end_time ?? event.start_time)?.toString() ?? '10:00';
		const titleVal = occurrenceOverrides ? (occurrenceOverrides.title ?? event.title) : event.title;
		const descriptionVal = occurrenceOverrides
			? (occurrenceOverrides.description ?? event.description ?? '')
			: (event.description ?? '');
		const colorVal = occurrenceOverrides
			? (occurrenceOverrides.color ?? event.color ?? null)
			: (event.color ?? null);
		return {
			title: titleVal,
			description: descriptionVal,
			startDate: occurrenceDate ?? event.start_date,
			startTime: normalizeTime(formatTime(origStart)),
			endDate: occurrenceDate ?? event.end_date ?? event.start_date,
			endTime: normalizeTime(formatTime(origEnd)),
			isAllDay: event.is_all_day,
			recurring: event.recurring,
			recurringFrequency: (event.recurring_frequency as string) ?? 'weekly',
			recurringEndDate: event.recurring_end_date ?? null,
			color: colorVal,
			participantIds: [...initialParticipantIds].sort(),
		};
	}, [event, occurrenceDate, occurrenceStartTime, occurrenceEndTime, occurrenceOverrides, initialParticipantIds]);

	const sortedParticipantIds = [...participantIds].sort();
	const hasChanges =
		!initialSnapshot ||
		initialSnapshot.title !== title.trim() ||
		initialSnapshot.description !== (description ?? '') ||
		initialSnapshot.startDate !== (startDate ?? '') ||
		initialSnapshot.startTime !== normalizeTime(startTime) ||
		initialSnapshot.endDate !== (endDate ?? startDate ?? '') ||
		initialSnapshot.endTime !== normalizeTime(endTime) ||
		initialSnapshot.isAllDay !== isAllDay ||
		initialSnapshot.recurring !== recurring ||
		initialSnapshot.recurringFrequency !== (recurringFrequency as string) ||
		initialSnapshot.recurringEndDate !== (recurring ? recurringEndDate : null) ||
		initialSnapshot.color !== (color ?? null) ||
		initialSnapshot.participantIds.length !== sortedParticipantIds.length ||
		!initialSnapshot.participantIds.every((id, i) => id === sortedParticipantIds[i]);

	const performSave = useCallback(
		async (scope: RecurrenceScope = 'all') => {
			if (!userId || !startDate || !startTime) return;

			setSaving(true);
			try {
				await saveAgendaEventForm({
					userId,
					startDate,
					startTime,
					endDate,
					endTime,
					isAllDay,
					recurring,
					recurringFrequency,
					recurringEndDate,
					color,
					title,
					description,
					participantIds,
					initialParticipantIds,
					event,
					occurrenceDate,
					occurrenceStartTime,
					externalSourceType,
					externalSourceId,
					scope,
				});
				onSuccess?.();
				onOpenChange(false);
			} catch (err: unknown) {
				toast.error(formatAgendaEventSaveError(err));
			} finally {
				setSaving(false);
			}
		},
		[
			userId,
			startDate,
			startTime,
			endDate,
			endTime,
			isAllDay,
			recurring,
			recurringFrequency,
			recurringEndDate,
			color,
			title,
			description,
			participantIds,
			initialParticipantIds,
			event,
			occurrenceDate,
			occurrenceStartTime,
			onSuccess,
			onOpenChange,
			externalSourceType,
			externalSourceId,
		],
	);

	return {
		formState: {
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
			participantIds,
			participantAddId,
			setParticipantAddId,
			participantProfiles,
		},
		handlers: {
			handleAddParticipant,
			handleRemoveParticipant,
			performSave,
		},
		saving,
		hasChanges,
	};
}
