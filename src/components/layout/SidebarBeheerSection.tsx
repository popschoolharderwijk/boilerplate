import { LuChevronDown, LuShieldCheck, LuWallet } from 'react-icons/lu';
import { NavItem } from '@/components/layout/NavItem';
import { adminNavItems, financeNavItems, NAV_GAP } from '@/components/layout/sidebar-config';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface SidebarBeheerSectionProps {
	collapsed: boolean;
	beheerOpen: boolean;
	onBeheerOpenChange: (open: boolean) => void;
	financeOpen: boolean;
	onFinanceOpenChange: (open: boolean) => void;
	isInFinance: boolean;
}

export function SidebarBeheerSection({
	collapsed,
	beheerOpen,
	onBeheerOpenChange,
	financeOpen,
	onFinanceOpenChange,
	isInFinance,
}: SidebarBeheerSectionProps) {
	if (collapsed) {
		return (
			<>
				<Separator />
				{financeNavItems.map((item) => (
					<NavItem key={item.href} {...item} collapsed={collapsed} />
				))}
				{adminNavItems.map((item) => (
					<NavItem key={item.href} {...item} collapsed={collapsed} />
				))}
			</>
		);
	}

	return (
		<Collapsible open={beheerOpen} onOpenChange={onBeheerOpenChange}>
			<CollapsibleTrigger asChild>
				<button
					type="button"
					className={cn(
						'mt-4 mb-1 flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors',
						'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
					)}
				>
					<LuShieldCheck className="h-3.5 w-3.5" />
					<span>Beheer</span>
					<LuChevronDown
						className={cn(
							'ml-auto h-3.5 w-3.5 transition-transform duration-200',
							beheerOpen ? 'rotate-0' : '-rotate-90',
						)}
					/>
				</button>
			</CollapsibleTrigger>
			<CollapsibleContent
				className="flex flex-col data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
				style={{ gap: NAV_GAP } as React.CSSProperties}
			>
				<SidebarFinanceGroup
					financeOpen={financeOpen}
					onFinanceOpenChange={onFinanceOpenChange}
					isInFinance={isInFinance}
				/>
				{adminNavItems.map((item) => (
					<NavItem key={item.href} {...item} collapsed={false} />
				))}
			</CollapsibleContent>
		</Collapsible>
	);
}

function SidebarFinanceGroup({
	financeOpen,
	onFinanceOpenChange,
	isInFinance,
}: {
	financeOpen: boolean;
	onFinanceOpenChange: (open: boolean) => void;
	isInFinance: boolean;
}) {
	return (
		<Collapsible open={financeOpen} onOpenChange={onFinanceOpenChange}>
			<CollapsibleTrigger asChild>
				<button
					type="button"
					className={cn(
						'flex w-full items-center rounded-lg text-sm font-medium transition-colors',
						isInFinance
							? 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90'
							: 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
					)}
				>
					<span className="grid size-10 shrink-0 place-items-center">
						<LuWallet className="h-5 w-5" />
					</span>
					<span className="truncate">Financiën</span>
					<LuChevronDown
						className={cn(
							'ml-auto mr-3 h-3.5 w-3.5 transition-transform duration-200',
							financeOpen ? 'rotate-0' : '-rotate-90',
						)}
					/>
				</button>
			</CollapsibleTrigger>
			<CollapsibleContent
				className="flex flex-col pl-4 pt-2 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
				style={{ gap: NAV_GAP } as React.CSSProperties}
			>
				{financeNavItems.map((item) => (
					<NavItem key={item.href} {...item} collapsed={false} />
				))}
			</CollapsibleContent>
		</Collapsible>
	);
}
