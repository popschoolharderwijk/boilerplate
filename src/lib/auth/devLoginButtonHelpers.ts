export function resolveDevLoginInnerContainerClass(showButton: boolean, isLocalDev: boolean): string {
	if (!showButton) {
		return 'flex flex-col w-full';
	}

	if (isLocalDev) {
		return 'flex flex-col w-full gap-1.5 p-2 rounded-md border bg-background border-green-500/30 dark:border-green-400/30';
	}

	return 'flex flex-col w-full gap-1.5 p-2 rounded-md border bg-background border-orange-500/30 dark:border-orange-400/30';
}
