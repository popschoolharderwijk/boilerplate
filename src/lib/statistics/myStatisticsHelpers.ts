export interface TeacherStatisticsAgreement {
	student_user_id: string;
	lesson_types: { is_group_lesson?: boolean } | { is_group_lesson?: boolean }[] | null;
}

export interface TeacherStatistics {
	studentCount: number;
	lessonsPerWeek: number;
	groupLessons: number;
	upcomingLessons: number;
}

export function isAgreementGroupLesson(lessonTypes: TeacherStatisticsAgreement['lesson_types']): boolean {
	if (Array.isArray(lessonTypes)) {
		return lessonTypes[0]?.is_group_lesson ?? false;
	}
	return lessonTypes?.is_group_lesson ?? false;
}

export function computeTeacherStatistics(agreements: TeacherStatisticsAgreement[]): TeacherStatistics {
	const uniqueStudents = new Set(agreements.map((agreement) => agreement.student_user_id));
	const groupLessonCount = agreements.filter((agreement) => isAgreementGroupLesson(agreement.lesson_types)).length;

	return {
		studentCount: uniqueStudents.size,
		lessonsPerWeek: agreements.length,
		groupLessons: groupLessonCount,
		upcomingLessons: agreements.length,
	};
}
