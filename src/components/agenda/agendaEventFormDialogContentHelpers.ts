import type { DeviationInfo } from '@/types/agenda-events';

export function resolveAgendaProjectSourceSelection(projectId: string | null): {
	selectedProjectId: string | null;
	selectedSourceType: 'project' | 'manual';
} {
	return {
		selectedProjectId: projectId,
		selectedSourceType: projectId ? 'project' : 'manual',
	};
}

export function shouldShowAgendaProjectButton(isPrivileged: boolean): boolean {
	return isPrivileged;
}

export function shouldShowAgendaDeviationBanner(canRevert: boolean, hasTimeOrDateChange: boolean | undefined): boolean {
	return canRevert && Boolean(hasTimeOrDateChange);
}

export function shouldShowAgendaCancellationBanner(isCancelledEvent: boolean, cancelType: unknown): boolean {
	return isCancelledEvent && cancelType != null;
}

export function shouldRenderAgendaDeviationBanner(
	canRevert: boolean,
	hasTimeOrDateChange: boolean | undefined,
	deviationInfo: unknown,
): boolean {
	return shouldShowAgendaDeviationBanner(canRevert, hasTimeOrDateChange) && deviationInfo != null;
}

export function shouldRenderAgendaCancellationBanner(isCancelledEvent: boolean, cancelType: unknown): boolean {
	return shouldShowAgendaCancellationBanner(isCancelledEvent, cancelType) && cancelType != null;
}

export function resolveAgendaDeviationBannerProps(
	canRevert: boolean,
	hasTimeOrDateChange: boolean | undefined,
	deviationInfo: DeviationInfo | null | undefined,
): { deviationInfo: DeviationInfo } | null {
	if (!shouldRenderAgendaDeviationBanner(canRevert, hasTimeOrDateChange, deviationInfo) || !deviationInfo) {
		return null;
	}
	return { deviationInfo };
}

export function resolveAgendaCancellationBannerProps<T>(
	isCancelledEvent: boolean,
	cancelType: T | null | undefined,
): { cancellationType: T } | null {
	if (!shouldRenderAgendaCancellationBanner(isCancelledEvent, cancelType) || cancelType == null) {
		return null;
	}
	return { cancellationType: cancelType };
}
