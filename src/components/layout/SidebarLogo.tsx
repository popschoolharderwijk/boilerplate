import { SidebarLogoBrand, SidebarLogoToggleButton } from '@/components/layout/SidebarLogoParts';
import { cn } from '@/lib/utils';

interface SidebarLogoProps {
	collapsed: boolean;
	onToggle?: () => void;
}

export function SidebarLogo({ collapsed, onToggle }: SidebarLogoProps) {
	return (
		<div
			className={cn(
				'flex h-16 items-center border-b border-sidebar-border',
				collapsed ? 'justify-center px-0' : 'gap-2 px-4',
			)}
		>
			<SidebarLogoBrand collapsed={collapsed} />
			<SidebarLogoToggleButton collapsed={collapsed} onToggle={onToggle} />
		</div>
	);
}
