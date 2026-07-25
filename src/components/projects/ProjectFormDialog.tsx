import { ProjectFormFields } from '@/components/projects/ProjectFormFields';
import { useProjectFormDialog } from '@/components/projects/useProjectFormDialog';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { SubmitButton } from '@/components/ui/submit-button';

interface ProjectFormDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	project: {
		id: string;
		name: string;
		description: string | null;
		cost_center: string | null;
		is_active: boolean;
		owner_user_id: string;
		label_id: string;
	} | null;
	onSaved: () => void;
}

export function ProjectFormDialog({ open, onOpenChange, project, onSaved }: ProjectFormDialogProps) {
	const vm = useProjectFormDialog({ open, project, onOpenChange, onSaved });

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[500px]">
				<form onSubmit={vm.handleSubmit}>
					<DialogHeader>
						<DialogTitle>{vm.isEditing ? 'Project bewerken' : 'Nieuw project'}</DialogTitle>
						<DialogDescription>
							{vm.isEditing
								? 'Pas de gegevens van het project aan.'
								: 'Vul de gegevens in voor het nieuwe project.'}
						</DialogDescription>
					</DialogHeader>

					<ProjectFormFields
						form={vm.form}
						isEditing={vm.isEditing}
						labels={vm.labels}
						labelsLoading={vm.labelsLoading}
						projectId={vm.projectId}
						onFieldChange={vm.setField}
					/>

					<DialogFooter>
						<Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
							Annuleren
						</Button>
						<SubmitButton type="submit" loading={vm.saving}>
							{vm.isEditing ? 'Opslaan' : 'Aanmaken'}
						</SubmitButton>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
