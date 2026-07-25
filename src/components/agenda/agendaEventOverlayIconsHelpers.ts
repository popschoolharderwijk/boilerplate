export function shouldShowChangedOverlayIcon(isCancelled: boolean, hasTimeOrDateChange: boolean): boolean {
	return hasTimeOrDateChange && !isCancelled;
}

export function getCancelledOverlayIconClass(isTeacherCancelled: boolean, iconColorClass: string): string {
	return isTeacherCancelled ? 'text-orange-500' : iconColorClass;
}
