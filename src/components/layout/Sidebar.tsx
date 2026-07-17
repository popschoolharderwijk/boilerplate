import { useLocation } from 'react-router-dom';
import { DevTools } from '@/components/DevTools';
import { SidebarBeheerSection } from '@/components/layout/SidebarBeheerSection';
import { SidebarLogo } from '@/components/layout/SidebarLogo';
import { SidebarMainNav } from '@/components/layout/SidebarMainNav';
import { adminHrefs, financeHrefs, isPathInGroup, NAV_GAP } from '@/components/layout/sidebar-config';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useSidebarGroupState } from '@/hooks/useSidebarGroupState';
import { useSidebarNavVisibility } from '@/hooks/useSidebarNavVisibility';
import { resolveSidebarDevToolsContainerClass, resolveSidebarWidthClass } from '@/lib/layout/sidebarShellHelpers';
import { cn } from '@/lib/utils';

interface SidebarProps {
	collapsed?: boolean;
	onToggle?: () => void;
}

export function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
	const visibility = useSidebarNavVisibility();
	const { pathname } = useLocation();
	const isInBeheer = isPathInGroup(pathname, adminHrefs);
	const isInFinance = isPathInGroup(pathname, financeHrefs);
	const { beheerOpen, setBeheerOpen, financeOpen, setFinanceOpen } = useSidebarGroupState(isInBeheer, isInFinance);

	return (
		<TooltipProvider delayDuration={0}>
			<aside
				className={cn(
					'relative flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300',
					resolveSidebarWidthClass(collapsed),
				)}
			>
				<SidebarLogo collapsed={collapsed} onToggle={onToggle} />

				<div className="flex-1 min-h-0 w-full overflow-hidden">
					<ScrollArea className="h-full">
						<div
							className="w-full px-2"
							style={{ paddingTop: NAV_GAP, paddingBottom: NAV_GAP } as React.CSSProperties}
						>
							<nav className="flex flex-col w-full" style={{ gap: NAV_GAP } as React.CSSProperties}>
								<SidebarMainNav collapsed={collapsed} {...visibility} />
								{visibility.showAdminNav && (
									<SidebarBeheerSection
										collapsed={collapsed}
										beheerOpen={beheerOpen}
										onBeheerOpenChange={setBeheerOpen}
										financeOpen={financeOpen}
										onFinanceOpenChange={setFinanceOpen}
										isInFinance={isInFinance}
									/>
								)}
							</nav>
						</div>
					</ScrollArea>
				</div>

				<div className={cn('border-t border-sidebar-border', resolveSidebarDevToolsContainerClass(collapsed))}>
					<DevTools className={collapsed ? undefined : 'w-full'} collapsed={collapsed} />
				</div>
			</aside>
		</TooltipProvider>
	);
}
