import { useCallback, useEffect, useState } from 'react';
import { getDisplayName } from '@/lib/display-name';
import { shouldLoadStudentInfoModal, shouldResetStudentInfoModal } from '@/lib/students/studentInfoModalHelpers';
import { loadMergedStudentRecord } from '@/lib/students/studentInfoModalLoad';
import type { Student } from '@/types/students';
import type { User } from '@/types/users';

export function useStudentInfoModal(open: boolean, student: User | null, canViewFullData: boolean) {
	const [fullData, setFullData] = useState<Student | null>(null);
	const [loading, setLoading] = useState(false);

	const loadFullStudentData = useCallback(async () => {
		if (!student || !canViewFullData) return;

		setLoading(true);
		try {
			setFullData(await loadMergedStudentRecord(student.user_id));
		} catch (error) {
			console.error('Error loading student data:', error);
		} finally {
			setLoading(false);
		}
	}, [student, canViewFullData]);

	useEffect(() => {
		if (shouldLoadStudentInfoModal(open, student)) {
			void loadFullStudentData();
			return;
		}
		if (shouldResetStudentInfoModal(open, student)) {
			setFullData(null);
		}
	}, [open, student, loadFullStudentData]);

	if (!student) {
		return null;
	}

	const display = fullData ?? student;

	return {
		display,
		displayName: getDisplayName(display),
		fullData,
		loading,
	};
}
