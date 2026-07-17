import { useEffect, useState } from 'react';
import type { AvailabilitySlot, ExistingAgreementForSlot, ExistingTrialLessonForSlot } from '@/lib/agreementSlots';
import {
	loadTrialLessonSchedulingData,
	type TrialLessonSchedulingTeacher,
} from '@/lib/trial-lessons/loadTrialLessonSchedulingData';

export function useTrialLessonSlotMaps(
	open: boolean,
	lessonTypeId: string | null | undefined,
	fromDate: string,
	toDate: string,
	clearSelected: () => void,
) {
	const [teachers, setTeachers] = useState<Map<string, TrialLessonSchedulingTeacher>>(new Map());
	const [availabilityByTeacher, setAvailabilityByTeacher] = useState<Map<string, AvailabilitySlot[]>>(new Map());
	const [agreementsByTeacher, setAgreementsByTeacher] = useState<Map<string, ExistingAgreementForSlot[]>>(new Map());
	const [trialsByTeacher, setTrialsByTeacher] = useState<Map<string, ExistingTrialLessonForSlot[]>>(new Map());
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (!open) return;
		setLoading(true);
		void loadTrialLessonSchedulingData(lessonTypeId ?? null, fromDate, toDate).then((data) => {
			setTeachers(data.teachers);
			setAvailabilityByTeacher(data.availabilityByTeacher);
			setAgreementsByTeacher(data.agreementsByTeacher);
			setTrialsByTeacher(data.trialsByTeacher);
			setLoading(false);
			clearSelected();
		});
	}, [open, lessonTypeId, fromDate, toDate, clearSelected]);

	return { teachers, availabilityByTeacher, agreementsByTeacher, trialsByTeacher, loading };
}

export function createTrialLessonClearSelectedHandler(setSelected: (value: null) => void): () => void {
	return () => setSelected(null);
}
