import type { FormEvent } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { FreeSlotForTeacher } from '@/lib/agreementSlots';
import {
	buildScheduleTrialLessonPayload,
	getScheduleTrialLessonErrorMessage,
} from '@/lib/trial-lessons/scheduleTrialLessonHelpers';

interface SubmitScheduleTrialLessonInput {
	signupRequestId?: string;
	lessonTypeId?: string;
	lessonTypeOptionId?: string | null;
	selected: FreeSlotForTeacher;
	duration: number;
	notes: string;
	studentEmail: string;
	studentFirstName: string;
	studentLastName: string;
	hasSignupRequest: boolean;
	onSuccess: () => void;
}

async function submitScheduleTrialLesson(input: SubmitScheduleTrialLessonInput): Promise<void> {
	const payload = buildScheduleTrialLessonPayload({
		signupRequestId: input.signupRequestId,
		lessonTypeId: input.lessonTypeId,
		lessonTypeOptionId: input.lessonTypeOptionId,
		teacherUserId: input.selected.teacher_user_id,
		scheduledDate: input.selected.date,
		scheduledStartTime: input.selected.start_time,
		durationMinutes: input.duration,
		notes: input.notes,
		studentEmail: input.studentEmail,
		studentFirstName: input.studentFirstName,
		studentLastName: input.studentLastName,
		hasSignupRequest: input.hasSignupRequest,
	});
	const { data, error } = await supabase.functions.invoke('schedule-trial-lesson', { body: payload });
	const responseData = data as { error?: string } | null;
	if (error || responseData?.error) {
		toast.error(getScheduleTrialLessonErrorMessage(responseData, error?.message));
		return;
	}
	toast.success('Proefles ingepland');
	input.onSuccess();
}

export function createScheduleTrialLessonSubmitHandler(
	getInput: () => Omit<SubmitScheduleTrialLessonInput, 'selected' | 'onSuccess'> & { onSuccess: () => void },
	getSelected: () => FreeSlotForTeacher | null,
	setSubmitting: (value: boolean) => void,
) {
	return async (e: FormEvent) => {
		e.preventDefault();
		const selected = getSelected();
		if (!selected) {
			toast.error('Selecteer een tijdslot');
			return;
		}
		setSubmitting(true);
		await submitScheduleTrialLesson({ ...getInput(), selected });
		setSubmitting(false);
	};
}
