import {
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from '@/components/ui/command';
import type { QuickNavItem } from '@/lib/layout/topNavHelpers';

interface TopNavCommandPaletteProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	quickNavItems: QuickNavItem[];
	onNavigate: (href: string) => void;
}

export function TopNavCommandPalette({ open, onOpenChange, quickNavItems, onNavigate }: TopNavCommandPaletteProps) {
	return (
		<CommandDialog open={open} onOpenChange={onOpenChange}>
			<CommandInput placeholder="Zoek leerlingen, docenten, acties..." />
			<CommandList>
				<CommandEmpty>Geen resultaten gevonden.</CommandEmpty>
				<CommandGroup heading="Navigatie">
					{quickNavItems.map((item) => (
						<CommandItem
							key={item.href}
							onSelect={() => {
								onNavigate(item.href);
								onOpenChange(false);
							}}
						>
							{item.label}
						</CommandItem>
					))}
				</CommandGroup>
			</CommandList>
		</CommandDialog>
	);
}
