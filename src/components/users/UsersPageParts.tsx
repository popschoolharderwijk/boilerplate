import { LuTrash2 } from 'react-icons/lu';
import { Button } from '@/components/ui/button';
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog';
import { getDisplayName } from '@/lib/display-name';
import { canDeleteUserRow, type UserWithRole } from '@/lib/users/usersPageHelpers';

interface UsersDeleteDialogProps {
	deleteDialog: { open: boolean; user: UserWithRole } | null;
	onOpenChange: (open: boolean) => void;
	onConfirm: () => Promise<void>;
}

export function UsersDeleteDialog({ deleteDialog, onOpenChange, onConfirm }: UsersDeleteDialogProps) {
	if (!deleteDialog) return null;

	return (
		<ConfirmDeleteDialog
			open={deleteDialog.open}
			onOpenChange={onOpenChange}
			title="Gebruiker verwijderen"
			description={
				<>
					Weet je zeker dat je <strong>{getDisplayName(deleteDialog.user)}</strong> wilt verwijderen? Deze
					actie kan niet ongedaan worden gemaakt.
					<p className="mt-2 text-muted-foreground">
						Alle gegevens van deze gebruiker worden permanent verwijderd, inclusief rollen en gerelateerde
						data.
					</p>
				</>
			}
			onConfirm={onConfirm}
		/>
	);
}

interface UsersRowDeleteButtonProps {
	user: UserWithRole;
	currentUserId: string | undefined;
	onDelete: (user: UserWithRole) => void;
}

function UsersRowDeleteButton({ user, currentUserId, onDelete }: UsersRowDeleteButtonProps) {
	if (!canDeleteUserRow(user.user_id, currentUserId)) return null;

	return (
		<Button
			variant="ghost"
			size="icon"
			className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
			onClick={(e) => {
				e.stopPropagation();
				onDelete(user);
			}}
		>
			<LuTrash2 className="h-4 w-4" />
		</Button>
	);
}

export function buildUsersRowActions(input: {
	canManage: boolean;
	currentUserId: string | undefined;
	onEdit: (user: UserWithRole) => void;
	onDelete: (user: UserWithRole) => void;
}) {
	if (!input.canManage) return undefined;

	return {
		onEdit: input.onEdit,
		onDelete: (user: UserWithRole) => {
			if (!canDeleteUserRow(user.user_id, input.currentUserId)) return;
			input.onDelete(user);
		},
		render: (user: UserWithRole) => (
			<UsersRowDeleteButton user={user} currentUserId={input.currentUserId} onDelete={input.onDelete} />
		),
	};
}
