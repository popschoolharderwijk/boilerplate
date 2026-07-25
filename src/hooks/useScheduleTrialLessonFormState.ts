import { useEffect, useState } from 'react';
import type { FreeSlotForTeacher } from '@/lib/agreementSlots';
import { getScheduleTrialLessonResetValues, todayPlus } from '@/lib/trial-lessons/scheduleTrialLessonHelpers';

export interface ScheduleTrialLessonSignupRequestPrefill {
	id: string;
	first_name: string;
	last_name: string;
	email: string;
	lesson_type_id: string;
	lesson_type_option_id: string | null;
}

function resetFormFields(
	signupRequest: ScheduleTrialLessonSignupRequestPrefill | null | undefined,
	setters: {
		setStudentEmail: (value: string) => void;
		setStudentFirstName: (value: string) => void;
		setStudentLastName: (value: string) => void;
		setNotes: (value: string) => void;
		setSelected: (value: FreeSlotForTeacher | null) => void;
		setFromDate: (value: string) => void;
		setToDate: (value: string) => void;
		setDuration: (value: number) => void;
	},
) {
	const values = getScheduleTrialLessonResetValues(signupRequest);
	setters.setStudentEmail(values.studentEmail);
	setters.setStudentFirstName(values.studentFirstName);
	setters.setStudentLastName(values.studentLastName);
	setters.setNotes(values.notes);
	setters.setSelected(null);
	setters.setFromDate(values.fromDate);
	setters.setToDate(values.toDate);
	setters.setDuration(values.duration);
}

export function useScheduleTrialLessonFormState(
	open: boolean,
	signupRequest: ScheduleTrialLessonSignupRequestPrefill | null | undefined,
) {
	const [fromDate, setFromDate] = useState(todayPlus(1));
	const [toDate, setToDate] = useState(todayPlus(30));
	const [duration, setDuration] = useState(30);
	const [notes, setNotes] = useState('');
	const [studentEmail, setStudentEmail] = useState('');
	const [studentFirstName, setStudentFirstName] = useState('');
	const [studentLastName, setStudentLastName] = useState('');
	const [selected, setSelected] = useState<FreeSlotForTeacher | null>(null);
	const [submitting, setSubmitting] = useState(false);

	useEffect(() => {
		if (!open) return;
		resetFormFields(signupRequest, {
			setStudentEmail,
			setStudentFirstName,
			setStudentLastName,
			setNotes,
			setSelected,
			setFromDate,
			setToDate,
			setDuration,
		});
	}, [open, signupRequest]);

	return {
		fromDate,
		toDate,
		duration,
		notes,
		studentEmail,
		studentFirstName,
		studentLastName,
		selected,
		submitting,
		setFromDate,
		setToDate,
		setDuration,
		setNotes,
		setStudentEmail,
		setStudentFirstName,
		setStudentLastName,
		setSelected,
		setSubmitting,
	};
}
