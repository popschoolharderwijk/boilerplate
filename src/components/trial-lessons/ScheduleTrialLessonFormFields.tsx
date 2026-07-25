import {
	ScheduleTrialLessonFormBody,
	type ScheduleTrialLessonFormBodyProps,
} from '@/components/trial-lessons/ScheduleTrialLessonFormSections';

export type ScheduleTrialLessonFormFieldsProps = ScheduleTrialLessonFormBodyProps;

export function ScheduleTrialLessonFormFields(props: ScheduleTrialLessonFormFieldsProps) {
	return <ScheduleTrialLessonFormBody {...props} />;
}
