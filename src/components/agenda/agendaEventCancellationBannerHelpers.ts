import type { CancellationType } from '@/types/agenda-events';

export function getCancellationBannerMessage(cancellationType: CancellationType, needsReschedule?: boolean): string {
	if (cancellationType === 'teacher') {
		return needsReschedule ? 'Docent heeft afgezegd — inhalen vereist' : 'Docent heeft afgezegd — ingehaald';
	}
	return 'Leerling heeft afgezegd';
}

export function getCancellationBannerClassName(cancellationType: CancellationType): string {
	if (cancellationType === 'teacher') {
		return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
	}
	return 'bg-destructive/10 text-destructive';
}

export function shouldShowCancellationRescheduleButton(
	cancellationType: CancellationType,
	needsReschedule?: boolean,
	onMarkRescheduled?: () => void,
): boolean {
	return cancellationType === 'teacher' && Boolean(needsReschedule && onMarkRescheduled);
}
