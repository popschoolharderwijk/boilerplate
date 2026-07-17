import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface StudentInfoModalHeaderProps {
	displayName: string;
	email: string;
	avatarUrl: string | null | undefined;
	initials: string;
}

export function StudentInfoModalHeader({ displayName, email, avatarUrl, initials }: StudentInfoModalHeaderProps) {
	return (
		<DialogHeader className="pb-2">
			<div className="flex items-center gap-4">
				<Avatar className="h-16 w-16">
					<AvatarImage src={avatarUrl ?? undefined} alt={displayName} />
					<AvatarFallback className="bg-primary/10 text-primary text-xl font-medium">
						{initials}
					</AvatarFallback>
				</Avatar>
				<div className="flex-1 min-w-0">
					<DialogTitle className="text-xl">{displayName}</DialogTitle>
					<DialogDescription className="text-sm">{email}</DialogDescription>
				</div>
			</div>
		</DialogHeader>
	);
}
