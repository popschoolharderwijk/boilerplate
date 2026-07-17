export function resolveTrialLessonSlotRowClassName(isSelected: boolean): string {
	return `flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-accent ${
		isSelected ? 'bg-accent' : ''
	}`;
}
