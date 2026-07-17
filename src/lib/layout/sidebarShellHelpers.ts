export function resolveSidebarWidthClass(collapsed: boolean): string {
	return collapsed ? 'w-16' : 'w-64';
}

export function resolveSidebarDevToolsContainerClass(collapsed: boolean): string {
	return collapsed ? 'flex justify-center p-2' : 'p-2 w-full';
}

export function shouldShowSidebarAdminSection(showAdminNav: boolean): boolean {
	return showAdminNav;
}
