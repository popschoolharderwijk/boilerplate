import type { StudentFormDialogViewModel } from '@/components/students/useStudentFormDialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { UserSelectSingle } from '@/components/ui/user-select';
import {
	getStudentFormModeButtonVariant,
	shouldRenderStudentFormModeSection,
	shouldShowExistingUserPicker,
} from '@/lib/students/studentFormModeSectionHelpers';

interface StudentFormModeSectionProps {
	vm: StudentFormDialogViewModel;
}

export function StudentFormModeSection({ vm }: StudentFormModeSectionProps) {
	const { mode, selectedUserId, selectExistingUser, switchToNewUserMode, switchToExistingUserMode } = vm;

	if (!shouldRenderStudentFormModeSection(vm.isEditMode)) return null;

	return (
		<>
			<div className="space-y-1.5">
				<Label className="text-sm">Type leerling</Label>
				<div className="flex gap-2">
					<Button
						type="button"
						variant={getStudentFormModeButtonVariant(mode, 'new-user')}
						onClick={switchToNewUserMode}
						className="flex-1"
					>
						Nieuwe gebruiker
					</Button>
					<Button
						type="button"
						variant={getStudentFormModeButtonVariant(mode, 'existing-user')}
						onClick={switchToExistingUserMode}
						className="flex-1"
					>
						Bestaande gebruiker
					</Button>
				</div>
			</div>

			{shouldShowExistingUserPicker(mode) && (
				<div className="space-y-1.5">
					<Label className="text-sm">Selecteer gebruiker *</Label>
					<UserSelectSingle
						value={selectedUserId}
						onChange={(user) => selectExistingUser(user?.user_id ?? null)}
					/>
				</div>
			)}
		</>
	);
}
