import { useCallback, useMemo } from 'react';
import {
	type ScheduleTrialLessonSignupRequestPrefill,
	useScheduleTrialLessonFormState,
} from '@/hooks/useScheduleTrialLessonFormState';
import { createTrialLessonClearSelectedHandler, useTrialLessonSlotMaps } from '@/hooks/useTrialLessonSlotMaps';
import { buildScheduleTrialLessonDialogView } from '@/lib/trial-lessons/scheduleTrialLessonDialogHelpers';
import { groupFreeSlotsByDate } from '@/lib/trial-lessons/scheduleTrialLessonHelpers';

interface UseScheduleTrialLessonDialogParams {
	open: boolean;
	signupRequest?: ScheduleTrialLessonSignupRequestPrefill | null;
	onOpenChange: (open: boolean) => void;
	onScheduled?: () => void;
}

export function useScheduleTrialLessonDialog(params: UseScheduleTrialLessonDialogParams) {
	const form = useScheduleTrialLessonFormState(params.open, params.signupRequest);
	const clearSelected = useCallback(createTrialLessonClearSelectedHandler(form.setSelected), []);

	const slotMaps = useTrialLessonSlotMaps(
		params.open,
		params.signupRequest?.lesson_type_id,
		form.fromDate,
		form.toDate,
		clearSelected,
	);

	const slotsGroupedByDate = useMemo(
		() =>
			groupFreeSlotsByDate(
				form.fromDate,
				form.toDate,
				form.duration,
				slotMaps.availabilityByTeacher,
				slotMaps.agreementsByTeacher,
				slotMaps.trialsByTeacher,
			),
		[
			form.fromDate,
			form.toDate,
			form.duration,
			slotMaps.availabilityByTeacher,
			slotMaps.agreementsByTeacher,
			slotMaps.trialsByTeacher,
		],
	);

	return buildScheduleTrialLessonDialogView({
		open: params.open,
		signupRequest: params.signupRequest,
		onOpenChange: params.onOpenChange,
		onScheduled: params.onScheduled,
		form,
		slotMaps,
		slotsGroupedByDate,
	});
}
