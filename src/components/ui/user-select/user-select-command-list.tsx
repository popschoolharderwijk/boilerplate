import type { ReactNode } from 'react';
import { LuLoaderCircle } from 'react-icons/lu';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandList } from '@/components/ui/command';

interface UserSelectCommandListProps {
	loading: boolean;
	searchQuery: string;
	onSearchQueryChange: (value: string) => void;
	children: ReactNode;
}

export function UserSelectCommandList({
	loading,
	searchQuery,
	onSearchQueryChange,
	children,
}: UserSelectCommandListProps) {
	return (
		<Command shouldFilter={false}>
			<CommandInput placeholder="Zoek gebruiker..." value={searchQuery} onValueChange={onSearchQueryChange} />
			<CommandList className="max-h-[350px] overflow-y-auto">
				{loading ? (
					<div className="flex items-center justify-center py-6">
						<LuLoaderCircle className="h-5 w-5 animate-spin text-muted-foreground" />
					</div>
				) : (
					<>
						<CommandEmpty>Geen gebruikers gevonden.</CommandEmpty>
						<CommandGroup>{children}</CommandGroup>
					</>
				)}
			</CommandList>
		</Command>
	);
}
