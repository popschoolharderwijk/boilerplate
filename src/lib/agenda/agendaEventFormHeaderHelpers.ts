export function isAgendaLessonFormHeader(isLessonEvent: boolean, isLessonGroupEvent: boolean): boolean {
	return isLessonEvent || isLessonGroupEvent;
}
