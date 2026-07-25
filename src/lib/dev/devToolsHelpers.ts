export function resolveDevToolsHeaderClass(isLocalDev: boolean): string {
	if (isLocalDev) {
		return 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20';
	}
	return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20';
}

export function resolveDevToolsEnvironmentBadgeClass(isLocalDev: boolean): string {
	if (isLocalDev) {
		return 'bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/20';
	}
	return 'bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/20';
}

export function resolveDevToolsTriggerClass(isLocalDev: boolean): string {
	if (isLocalDev) {
		return 'text-green-600 dark:text-green-400 hover:bg-green-500/10';
	}
	return 'text-orange-600 dark:text-orange-400 hover:bg-orange-500/10';
}

function shouldRenderDevToolsProductionBadge(collapsed: boolean | undefined): boolean {
	return collapsed === true;
}

export type DevToolsRenderMode = 'hidden' | 'production-badge' | 'collapsed' | 'expanded';

export function resolveDevToolsRenderMode(isProduction: boolean, collapsed: boolean | undefined): DevToolsRenderMode {
	if (isProduction) {
		return shouldRenderDevToolsProductionBadge(collapsed) ? 'production-badge' : 'hidden';
	}
	if (collapsed) {
		return 'collapsed';
	}
	return 'expanded';
}
