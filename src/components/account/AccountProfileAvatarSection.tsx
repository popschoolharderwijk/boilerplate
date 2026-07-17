import type { ChangeEvent } from 'react';
import { LuTrash2, LuUpload } from 'react-icons/lu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
	getAvatarUploadInputId,
	resolveAvatarImageSrc,
	shouldShowAvatarDeleteButton,
} from '@/lib/account/accountProfileAvatarHelpers';
import type { AccountProfileState } from '@/lib/account/persistence';

interface AccountProfileAvatarSectionProps {
	profile: AccountProfileState | null;
	userInitials: string;
	saving: boolean;
	onUploadAvatar: (e: ChangeEvent<HTMLInputElement>) => void;
	onDeleteAvatar: () => void;
}

export function AccountProfileAvatarSection({
	profile,
	userInitials,
	saving,
	onUploadAvatar,
	onDeleteAvatar,
}: AccountProfileAvatarSectionProps) {
	const uploadInputId = getAvatarUploadInputId();
	const avatarSrc = resolveAvatarImageSrc(profile?.avatar_url);
	const showDeleteButton = shouldShowAvatarDeleteButton(profile?.avatar_url);

	return (
		<div className="flex items-center gap-4">
			<Avatar className="h-20 w-20">
				<AvatarImage src={avatarSrc} alt="Avatar" />
				<AvatarFallback className="bg-primary text-primary-foreground text-lg">{userInitials}</AvatarFallback>
			</Avatar>
			<div className="space-y-2">
				<Label htmlFor={uploadInputId}>Profielfoto</Label>
				<div className="flex items-center gap-2">
					<Input
						id={uploadInputId}
						type="file"
						accept="image/*"
						onChange={onUploadAvatar}
						disabled={saving}
						className="hidden"
					/>
					<Button
						type="button"
						variant="outline"
						onClick={() => document.getElementById(uploadInputId)?.click()}
						disabled={saving}
					>
						<LuUpload className="mr-2 h-4 w-4" />
						Upload avatar
					</Button>
					{showDeleteButton ? (
						<Button
							type="button"
							variant="outline"
							onClick={onDeleteAvatar}
							disabled={saving}
							className="text-destructive hover:text-destructive"
						>
							<LuTrash2 className="mr-2 h-4 w-4" />
							Verwijderen
						</Button>
					) : null}
				</div>
				<p className="text-xs text-muted-foreground">JPG, PNG of GIF. Max 5MB.</p>
			</div>
		</div>
	);
}
