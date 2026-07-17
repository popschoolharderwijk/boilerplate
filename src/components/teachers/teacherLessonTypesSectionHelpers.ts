export function shouldShowTeacherLessonTypesAddPopover(canEdit: boolean, availableLessonTypeCount: number): boolean {
	return canEdit && availableLessonTypeCount > 0;
}

export function shouldShowTeacherLessonTypesEmptyState(lessonTypeCount: number): boolean {
	return lessonTypeCount === 0;
}
