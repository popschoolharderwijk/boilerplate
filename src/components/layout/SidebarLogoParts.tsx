import { LuChevronLeft, LuMusic } from 'react-icons/lu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SidebarLogoBrandProps {
	collapsed: boolean;
}

export function SidebarLogoBrand({ collapsed }: SidebarLogoBrandProps) {
	return (
		<>
			<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
				<LuMusic className="h-5 w-5" />
			</div>
			{!collapsed && (
				<div className="flex flex-col">
					<span className="text-lg font-bold leading-tight">
						<span className="text-primary uppercase">POP</span>
						<span className="text-sidebar-foreground lowercase">school</span>
					</span>
					<span className="text-[10px] uppercase tracking-widest text-muted-foreground leading-tight mt-0.5">
						HARDERWIJK
					</span>
				</div>
			)}
		</>
	);
}

interface SidebarLogoToggleButtonProps {
	collapsed: boolean;
	onToggle?: () => void;
}

export function SidebarLogoToggleButton({ collapsed, onToggle }: SidebarLogoToggleButtonProps) {
	const className = collapsed
		? 'absolute right-2 top-4 h-8 w-8 text-muted-foreground hover:text-foreground'
		: 'ml-auto h-8 w-8 text-muted-foreground hover:text-foreground';

	return (
		<Button variant="ghost" size="icon" className={className} onClick={onToggle}>
			<LuChevronLeft className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')} />
		</Button>
	);
}
