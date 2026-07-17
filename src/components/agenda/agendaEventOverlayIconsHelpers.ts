export function shouldShowRecurringOverlayIcon(isRecurring: boolean): boolean {
	return isRecurring;
}

export function shouldShowCancelledOverlayIcon(isCancelled: boolean): boolean {
	return isCancelled;
}

export function shouldShowChangedOverlayIcon(isCancelled: boolean, hasTimeOrDateChange: boolean): boolean {
	return hasTimeOrDateChange && !isCancelled;
}

export function getCancelledOverlayIconClass(isTeacherCancelled: boolean, iconColorClass: string): string {
	return isTeacherCancelled ? 'text-orange-500' : iconColorClass;
}
