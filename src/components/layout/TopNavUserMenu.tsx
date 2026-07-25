import { useState } from 'react';
import { LuLogOut, LuMoon, LuPalette, LuSearch, LuShieldAlert, LuSun, LuUser } from 'react-icons/lu';
import { ChangelogDialog } from '@/components/layout/ChangelogDialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getNextTheme } from '@/lib/layout/topNavHelpers';

interface TopNavUserMenuProps {
	displayName: string;
	email: string | null | undefined;
	roleLabel: string | null;
	userInitials: string;
	avatarUrl: string | null | undefined;
	resolvedTheme: string;
	showAppVersion: boolean;
	onNavigateProfile: () => void;
	onNavigateAppearance: () => void;
	onNavigateAccount: () => void;
	onSignOut: () => void;
	onToggleTheme: () => void;
}

export function TopNavUserMenu({
	displayName,
	email,
	roleLabel,
	userInitials,
	avatarUrl,
	resolvedTheme,
	showAppVersion,
	onNavigateProfile,
	onNavigateAppearance,
	onNavigateAccount,
	onSignOut,
	onToggleTheme,
}: TopNavUserMenuProps) {
	const [changelogOpen, setChangelogOpen] = useState(false);
	const appVersion = import.meta.env.VITE_APP_VERSION;
	const showVersion = showAppVersion && Boolean(appVersion);

	return (
		<>
			<Button variant="ghost" size="icon" className="h-9 w-9" onClick={onToggleTheme}>
				{resolvedTheme === 'dark' ? <LuMoon className="h-5 w-5" /> : <LuSun className="h-5 w-5" />}
				<span className="sr-only">Thema wisselen</span>
			</Button>

			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="ghost" className="relative h-9 w-9 rounded-full">
						<Avatar className="h-9 w-9">
							<AvatarImage src={avatarUrl || undefined} alt="Avatar" />
							<AvatarFallback className="bg-primary text-primary-foreground text-sm">
								{userInitials}
							</AvatarFallback>
						</Avatar>
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent className="w-56" align="end" forceMount>
					<DropdownMenuLabel className="font-normal">
						<div className="flex flex-col space-y-1">
							<p className="text-sm font-medium leading-none">{displayName}</p>
							<p className="text-xs leading-none text-muted-foreground">{email}</p>
							{roleLabel && (
								<p className="text-xs leading-none text-muted-foreground capitalize mt-0.5">
									{roleLabel}
								</p>
							)}
						</div>
					</DropdownMenuLabel>
					<DropdownMenuSeparator />
					<DropdownMenuItem onClick={onNavigateProfile}>
						<LuUser className="mr-2 h-4 w-4" />
						<span>Profiel</span>
					</DropdownMenuItem>
					<DropdownMenuItem onClick={onNavigateAppearance}>
						<LuPalette className="mr-2 h-4 w-4" />
						<span>Weergave</span>
					</DropdownMenuItem>
					<DropdownMenuItem onClick={onNavigateAccount}>
						<LuShieldAlert className="mr-2 h-4 w-4" />
						<span>Account</span>
					</DropdownMenuItem>
					<DropdownMenuSeparator />
					<DropdownMenuItem onClick={onSignOut}>
						<LuLogOut className="mr-2 h-4 w-4" />
						<span>Uitloggen</span>
					</DropdownMenuItem>
					{showVersion && (
						<>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								className="justify-center text-xs text-muted-foreground tabular-nums"
								onSelect={() => setChangelogOpen(true)}
								aria-label={`Versie ${appVersion}, bekijk changelog`}
							>
								v{appVersion}
							</DropdownMenuItem>
						</>
					)}
				</DropdownMenuContent>
			</DropdownMenu>

			{showVersion && <ChangelogDialog open={changelogOpen} onClose={() => setChangelogOpen(false)} />}
		</>
	);
}

export function TopNavSearchButton({ onOpenSearch }: { onOpenSearch: () => void }) {
	return (
		<Button
			variant="outline"
			className="relative h-9 w-full max-w-sm justify-start text-sm text-muted-foreground shrink-0"
			onClick={onOpenSearch}
		>
			<LuSearch className="mr-2 h-4 w-4" />
			<span>Zoeken...</span>
			<kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
				<span className="text-xs">⌘</span>K
			</kbd>
		</Button>
	);
}

export function createThemeToggleHandler(resolvedTheme: string, setTheme: (theme: 'light' | 'dark') => void) {
	return () => setTheme(getNextTheme(resolvedTheme));
}
