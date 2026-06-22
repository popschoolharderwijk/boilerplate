import { useCallback, useEffect, useMemo } from 'react';
import { Calendar } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import { toast } from 'sonner';
import { AgendaEventFormDialog, type DeleteScope, type DeviationInfo } from '@/components/agenda/AgendaEventFormDialog';
import { StudentInfoModal } from '@/components/students/StudentInfoModal';
import { PageSkeleton } from '@/components/ui/page-skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAgendaData } from '@/hooks/useAgendaData';
import { useAgendaUI } from '@/hooks/useAgendaUI';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { formatDateToDb } from '@/lib/date/date-format';
import { formatTimeFromDate } from '@/lib/time/time-format';
import type { AgendaEventRow, CancellationType } from '@/types/agenda-events';
import type { AgendaLessonAgreement } from '@/types/lesson-agreements';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import { CalendarViewProvider } from '@/components/agenda/CalendarViewContext';
import { ConfirmCancelDialog } from '@/components/agenda/ConfirmCancelDialog';
import { Legend } from '@/components/agenda/Legend';
import { RecurrenceChoiceDialog, type RecurrenceScope } from '@/components/agenda/RecurrenceChoiceDialog';
import type { CalendarEvent } from '@/components/agenda/types';
import { buildCalendarEvents } from '@/lib/agenda/buildCalendarEvents';
import { getCalendarProps } from '@/lib/agenda/calendarProps';
import { cancelLesson } from '@/lib/agenda/cancelLesson';
import { deleteAgendaEvent } from '@/lib/agenda/deleteAgendaEvent';
import { moveAgendaEvent } from '@/lib/agenda/moveAgendaEvent';
import { needsRecurrenceChoice } from '@/lib/agenda/needsRecurrenceChoice';
import { notifyAgendaOpResult } from '@/lib/agenda/notifyAgendaOpResult';
import { revertDeviation } from '@/lib/agenda/revertDeviation';
import { AVAILABILITY_CONFIG } from '@/lib/availability';

const DragAndDropCalendar = withDragAndDrop(Calendar);

export interface AgendaViewProps {
	userId?: string;
	canEdit?: boolean;
}

export function AgendaView({ userId: viewUserId, canEdit: canEditProp }: AgendaViewProps = {}) {
	const { user, isPrivileged, isTeacher } = useAuth();
	const effectiveUserId = viewUserId ?? user?.id;
	const canEdit = canEditProp ?? (!!user && (isPrivileged || isTeacher));
	const isOwnAgenda = !viewUserId;
	const canManageAgenda = isOwnAgenda || isPrivileged;

	const {
		agendaEvents,
		deviations,
		deviationsByEventId,
		agreementsMap,
		loading,
		loadData,
		getEnrichedEvents,
		noLessonPeriods,
	} = useAgendaData(effectiveUserId);

	const ui = useAgendaUI();

	useEffect(() => {
		if (!ui.formDialogOpen) ui.openingForEditRef.current = false;
	}, [ui.formDialogOpen, ui.openingForEditRef]);

	const events = useMemo(
		() => buildCalendarEvents(getEnrichedEvents(ui.currentDate, effectiveUserId), ui.optimisticMove),
		[getEnrichedEvents, ui.currentDate, effectiveUserId, ui.optimisticMove],
	);

	const selectedOccurrenceDeviation =
		!ui.selectedEvent?.resource.eventId || !ui.selectedEvent?.resource.originalDate || !ui.editingEvent?.id
			? null
			: (deviationsByEventId
					.get(ui.selectedEvent.resource.eventId)
					?.get(ui.selectedEvent.resource.originalDate) ?? null);

	const occurrenceParticipantIds =
		selectedOccurrenceDeviation?.participant_ids && selectedOccurrenceDeviation.participant_ids.length > 0
			? selectedOccurrenceDeviation.participant_ids
			: null;

	const occurrenceOverrides = selectedOccurrenceDeviation
		? {
				title: selectedOccurrenceDeviation.title ?? null,
				description: selectedOccurrenceDeviation.description ?? null,
				color: selectedOccurrenceDeviation.color ?? null,
			}
		: null;

	const occurrenceTimes = !ui.selectedEvent?.resource.isDeviation
		? { start: null, end: null }
		: {
				start: ui.selectedEvent.start ? formatTimeFromDate(ui.selectedEvent.start) : null,
				end: ui.selectedEvent.end ? formatTimeFromDate(ui.selectedEvent.end) : null,
			};

	const editingAgreement =
		ui.editingEvent?.source_type === 'lesson_agreement' && ui.editingEvent.source_id
			? (agreementsMap.get(ui.editingEvent.source_id) as AgendaLessonAgreement | undefined)
			: undefined;

	const readonlyParticipantIds = editingAgreement
		? editingAgreement.teacherUserId
			? [editingAgreement.student_user_id, editingAgreement.teacherUserId]
			: [editingAgreement.student_user_id]
		: [];

	const canAddParticipants =
		isPrivileged &&
		(ui.editingEvent?.source_type !== 'lesson_agreement' ||
			!ui.editingEvent.source_id ||
			!editingAgreement ||
			effectiveUserId === editingAgreement.teacherUserId);

	const deviationInfo: DeviationInfo | null =
		(ui.selectedEvent?.resource.isDeviation || ui.selectedEvent?.resource.isCancelled) &&
		ui.selectedEvent.resource.deviationId &&
		ui.selectedEvent.resource.originalDate &&
		ui.selectedEvent.resource.originalStartTime
			? {
					deviationId: ui.selectedEvent.resource.deviationId,
					originalDate: ui.selectedEvent.resource.originalDate,
					originalStartTime: ui.selectedEvent.resource.originalStartTime,
					isCancelled: ui.selectedEvent.resource.isCancelled,
					hasTimeOrDateChange: ui.selectedEvent.resource.hasTimeOrDateChange ?? false,
				}
			: null;

	const lessonType = ui.selectedEvent?.resource.lessonTypeName
		? {
				name: ui.selectedEvent.resource.lessonTypeName,
				icon: ui.selectedEvent.resource.lessonTypeIcon,
				color: ui.selectedEvent.resource.lessonTypeColor,
			}
		: null;

	const reloadAgenda = useCallback(() => loadData(false), [loadData]);

	const handleEventDrop = useCallback(
		async (
			args: { event: CalendarEvent; start: Date; end: Date },
			scope: RecurrenceScope = 'single',
			skipRecurrencePrompt = false,
		) => {
			if (!skipRecurrencePrompt && scope === 'single') {
				const originalStart = args.event.start;
				const originalEnd = args.event.end;
				if (
					originalStart &&
					originalEnd &&
					originalStart.getTime() === args.start.getTime() &&
					originalEnd.getTime() === args.end.getTime()
				) {
					return;
				}
				if (needsRecurrenceChoice(args.event)) {
					ui.setPendingDrop(args);
					ui.setRecurrenceChoiceAction('change');
					ui.setRecurrenceChoiceOpen(true);
					return;
				}
			}

			if (!canEdit || !user) return;
			ui.setOptimisticMove({ originalEvent: args.event, newStart: args.start, newEnd: args.end });
			const result = await moveAgendaEvent({
				event: args.event,
				start: args.start,
				end: args.end,
				scope,
				user,
				agendaEvents,
				deviations,
				agreementsMap,
			});
			if (!result.ok) {
				ui.setOptimisticMove(null);
				toast.error(result.message);
				return;
			}
			if (result.message) {
				await notifyAgendaOpResult(result, reloadAgenda);
			}
			ui.setOptimisticMove(null);
		},
		[canEdit, user, agendaEvents, deviations, agreementsMap, reloadAgenda, ui],
	);

	const handleCancelLesson = useCallback(
		async (
			scope: RecurrenceScope = 'single',
			cancellationType?: CancellationType,
			cancelledParticipantIds?: string[] | null,
		) => {
			if (!ui.selectedEvent || !user) return;
			ui.setIsCancelling(true);
			const result = await cancelLesson({
				selectedEvent: ui.selectedEvent,
				user,
				agendaEvents,
				agreementsMap,
				scope,
				cancellationType,
				cancelledParticipantIds,
			});
			if (!result.ok) {
				toast.error(result.message);
				ui.setIsCancelling(false);
				return;
			}
			toast.success(result.message);
			ui.setFormDialogOpen(false);
			ui.setSelectedEvent(null);
			ui.setCancelLessonConfirmOpen(false);
			ui.setIsCancelling(false);
			loadData(false);
		},
		[ui, user, agendaEvents, agreementsMap, loadData],
	);

	const handleSelectEvent = useCallback(
		async (event: CalendarEvent) => {
			const eventId = event.resource?.eventId;
			if (!eventId) return;
			ui.setSelectedEvent(event);
			const { data } = await supabase.from('agenda_events').select('*').eq('id', eventId).single();
			if (data) {
				ui.openingForEditRef.current = true;
				ui.setEditingEvent(data as AgendaEventRow);
				ui.setFormDialogOpen(true);
			}
		},
		[ui],
	);

	const handleSelectSlot = useCallback(
		(slotInfo: { start: Date; end: Date }) => {
			ui.setNewEventSlot({ start: slotInfo.start, end: slotInfo.end });
			ui.setEditingEvent(null);
			ui.setFormDialogOpen(true);
		},
		[ui],
	);

	const scrollToTime = useMemo(() => {
		const nowDate = new Date();
		return nowDate.getHours() >= AVAILABILITY_CONFIG.END_HOUR
			? new Date(0, 0, 0, AVAILABILITY_CONFIG.START_HOUR, 0, 0)
			: nowDate;
	}, []);

	const calendarProps = getCalendarProps({
		events,
		currentView: ui.currentView,
		currentDate: ui.currentDate,
		canEdit,
		isOwnAgenda: canManageAgenda,
		scrollToTime,
		onEventDrop: handleEventDrop,
		onSelectEvent: handleSelectEvent,
		onSelectSlot: handleSelectSlot,
		setCurrentView: ui.setCurrentView,
		setCurrentDate: ui.setCurrentDate,
		noLessonPeriods,
	});

	if (loading) return <PageSkeleton variant="agenda" />;

	return (
		<div className="flex flex-col gap-4 h-[calc(100vh-112px)] min-h-[640px]">
			<div className="popschool-calendar rounded-lg border border-border bg-card overflow-hidden flex-1 flex flex-col">
				<ScrollArea className="flex-1">
					<CalendarViewProvider value={ui.currentView}>
						<DragAndDropCalendar {...calendarProps} />
					</CalendarViewProvider>
				</ScrollArea>
			</div>
			<Legend show={ui.currentView !== 'agenda'} />

			<RecurrenceChoiceDialog
				open={ui.recurrenceChoiceOpen}
				onOpenChange={(open) => {
					ui.setRecurrenceChoiceOpen(open);
					if (!open) ui.setPendingDrop(null);
				}}
				action={ui.recurrenceChoiceAction}
				onChoose={(scope) => {
					if (ui.recurrenceChoiceAction === 'change' && ui.pendingDrop) {
						handleEventDrop(ui.pendingDrop, scope, true);
						ui.setPendingDrop(null);
					} else if (ui.recurrenceChoiceAction === 'cancel') {
						ui.setPendingCancelScope(scope);
						ui.setCancelLessonConfirmOpen(true);
					}
				}}
				hideFutureOption={
					ui.recurrenceChoiceAction === 'cancel' &&
					(ui.selectedEvent?.resource.isLesson ||
						ui.selectedEvent?.resource.sourceType === 'lesson_agreement')
				}
			/>

			<ConfirmCancelDialog
				open={ui.cancelLessonConfirmOpen}
				onOpenChange={ui.setCancelLessonConfirmOpen}
				onConfirm={(cancellationType, cancelledIds) =>
					handleCancelLesson(ui.pendingCancelScope, cancellationType, cancelledIds)
				}
				disabled={ui.isCancelling}
				participants={
					ui.selectedEvent?.resource.isGroupLesson ? (ui.selectedEvent.resource.users ?? []) : undefined
				}
				initialCancelledIds={ui.selectedEvent?.resource.cancelledParticipantIds ?? null}
			/>

			<StudentInfoModal
				open={ui.studentInfoModal.open}
				onOpenChange={(open) => ui.setStudentInfoModal({ ...ui.studentInfoModal, open })}
				student={ui.studentInfoModal.student}
			/>

			<AgendaEventFormDialog
				open={ui.formDialogOpen}
				onOpenChange={(open) => {
					ui.setFormDialogOpen(open);
					if (!open) {
						ui.setEditingEvent(null);
						ui.setNewEventSlot(null);
						ui.setSelectedEvent(null);
					}
				}}
				event={ui.editingEvent}
				initialSlot={ui.newEventSlot}
				onSuccess={reloadAgenda}
				onDelete={
					canManageAgenda && user
						? async (eventId: string, scope: DeleteScope, occurrenceDate?: string) => {
								await notifyAgendaOpResult(
									await deleteAgendaEvent({
										eventId,
										scope,
										occurrenceDate,
										userId: user.id,
									}),
									reloadAgenda,
									{ throwOnError: true },
								);
							}
						: undefined
				}
				occurrenceDate={ui.selectedEvent ? formatDateToDb(ui.selectedEvent.start) : null}
				occurrenceParticipantIds={occurrenceParticipantIds}
				occurrenceOverrides={occurrenceOverrides}
				occurrenceStartTime={occurrenceTimes.start}
				occurrenceEndTime={occurrenceTimes.end}
				deviationInfo={deviationInfo}
				onRevert={
					(ui.selectedEvent?.resource.isDeviation || ui.selectedEvent?.resource.isCancelled) &&
					ui.selectedEvent.resource.deviationId &&
					ui.selectedEvent.resource.eventId &&
					ui.selectedEvent.resource.originalDate &&
					canManageAgenda &&
					user
						? async () => {
								await notifyAgendaOpResult(
									await revertDeviation({
										eventId: ui.selectedEvent.resource.eventId,
										originalDate: ui.selectedEvent.resource.originalDate,
									}),
									reloadAgenda,
									{ throwOnError: true },
								);
							}
						: undefined
				}
				readonlyParticipantIds={readonlyParticipantIds}
				canAddParticipants={canAddParticipants}
				lessonType={lessonType}
				onCancelLesson={
					ui.selectedEvent?.resource.isCancelled && canEdit && user
						? () => handleCancelLesson('single')
						: undefined
				}
				onOpenCancelConfirm={
					ui.selectedEvent && !ui.selectedEvent.resource.isCancelled && canEdit && user
						? () => {
								if (needsRecurrenceChoice(ui.selectedEvent)) {
									ui.setRecurrenceChoiceAction('cancel');
									ui.setRecurrenceChoiceOpen(true);
								} else {
									ui.setCancelLessonConfirmOpen(true);
								}
							}
						: undefined
				}
				isCancelling={ui.isCancelling}
				cancellationType={ui.selectedEvent?.resource.cancellationType}
				needsReschedule={ui.selectedEvent?.resource.needsReschedule}
				onMarkRescheduled={
					ui.selectedEvent?.resource.needsReschedule &&
					ui.selectedEvent?.resource.deviationId &&
					canEdit &&
					user
						? async () => {
								const { error } = await supabase
									.from('agenda_event_deviations')
									.update({ needs_reschedule: false })
									.eq('id', ui.selectedEvent.resource.deviationId as string);
								if (error) {
									toast.error('Fout bij markeren als ingehaald');
									return;
								}
								toast.success('Les gemarkeerd als ingehaald');
								await reloadAgenda();
							}
						: undefined
				}
			/>
		</div>
	);
}
