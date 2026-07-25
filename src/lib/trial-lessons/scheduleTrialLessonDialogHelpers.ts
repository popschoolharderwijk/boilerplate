import type {
	ScheduleTrialLessonSignupRequestPrefill,
	useScheduleTrialLessonFormState,
} from '@/hooks/useScheduleTrialLessonFormState';
import type { useTrialLessonSlotMaps } from '@/hooks/useTrialLessonSlotMaps';
import { getScheduleTrialLessonDescription } from '@/lib/trial-lessons/scheduleTrialLessonHelpers';
import { createScheduleTrialLessonSubmitHandler } from '@/lib/trial-lessons/submitScheduleTrialLesson';

interface BuildScheduleTrialLessonDialogViewParams {
	open: boolean;
	signupRequest?: ScheduleTrialLessonSignupRequestPrefill | null;
	onOpenChange: (open: boolean) => void;
	onScheduled?: () => void;
	form: ReturnType<typeof useScheduleTrialLessonFormState>;
	slotMaps: ReturnType<typeof useTrialLessonSlotMaps>;
	slotsGroupedByDate: ReturnType<
		typeof import('@/lib/trial-lessons/scheduleTrialLessonHelpers').groupFreeSlotsByDate
	>;
}

export function buildScheduleTrialLessonDialogView(params: BuildScheduleTrialLessonDialogViewParams) {
	const handleSubmit = createScheduleTrialLessonSubmitHandler(
		() => ({
			signupRequestId: params.signupRequest?.id,
			lessonTypeId: params.signupRequest?.lesson_type_id,
			lessonTypeOptionId: params.signupRequest?.lesson_type_option_id,
			duration: params.form.duration,
			notes: params.form.notes,
			studentEmail: params.form.studentEmail,
			studentFirstName: params.form.studentFirstName,
			studentLastName: params.form.studentLastName,
			hasSignupRequest: Boolean(params.signupRequest),
			onSuccess: () => {
				params.onOpenChange(false);
				params.onScheduled?.();
			},
		}),
		() => params.form.selected,
		params.form.setSubmitting,
	);

	const dialogDescription = getScheduleTrialLessonDescription(
		Boolean(params.signupRequest),
		params.signupRequest?.first_name ?? '',
		params.signupRequest?.last_name ?? '',
	);

	return {
		...params.form,
		teachers: params.slotMaps.teachers,
		loading: params.slotMaps.loading,
		slotsGroupedByDate: params.slotsGroupedByDate,
		handleSubmit,
		dialogDescription,
	};
}
