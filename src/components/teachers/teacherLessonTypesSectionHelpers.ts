export function shouldShowTeacherLessonTypesAddPopover(canEdit: boolean, availableLessonTypeCount: number): boolean {
	return canEdit && availableLessonTypeCount > 0;
}
