import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { UserSelectSingle } from '@/components/ui/user-select';
import type { ProjectFormSaveInput } from '@/lib/projects/projectFormDialogHelpers';
import {
	buildProjectLabelSelectKey,
	getProjectLabelSelectPlaceholder,
	shouldShowProjectActiveCheckbox,
} from '@/lib/projects/projectFormFieldsHelpers';
import type { ProjectLabelOption } from '@/lib/projects/projectFormLabelHelpers';

interface ProjectFormFieldsProps {
	form: ProjectFormSaveInput & { id?: string };
	isEditing: boolean;
	labels: ProjectLabelOption[];
	labelsLoading: boolean;
	projectId: string | undefined;
	onFieldChange: <K extends keyof ProjectFormSaveInput>(key: K, value: ProjectFormSaveInput[K]) => void;
}

export function ProjectFormFields({
	form,
	isEditing,
	labels,
	labelsLoading,
	projectId,
	onFieldChange,
}: ProjectFormFieldsProps) {
	return (
		<div className="grid gap-4 py-4">
			<div className="grid gap-2">
				<Label htmlFor="project-name">Naam *</Label>
				<Input
					id="project-name"
					value={form.name}
					onChange={(e) => onFieldChange('name', e.target.value)}
					placeholder="Projectnaam"
					required
				/>
			</div>

			<div className="grid gap-2">
				<Label htmlFor="project-label">Label *</Label>
				<Select
					key={buildProjectLabelSelectKey(projectId, labels.length, form.label_id)}
					value={form.label_id}
					onValueChange={(value) => onFieldChange('label_id', value)}
				>
					<SelectTrigger id="project-label">
						<SelectValue placeholder={getProjectLabelSelectPlaceholder(labelsLoading)} />
					</SelectTrigger>
					<SelectContent>
						{labels.map((label) => (
							<SelectItem key={label.id} value={label.id}>
								{label.name} ({label.domain_name})
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<div className="grid gap-2">
				<Label>Eigenaar *</Label>
				<UserSelectSingle
					value={form.owner_user_id || null}
					onChange={(user) => onFieldChange('owner_user_id', user?.user_id ?? '')}
					placeholder="Selecteer een eigenaar"
				/>
			</div>

			<div className="grid gap-2">
				<Label htmlFor="project-cost-center">Kostenplaats</Label>
				<Input
					id="project-cost-center"
					value={form.cost_center}
					onChange={(e) => onFieldChange('cost_center', e.target.value)}
					placeholder="bijv. KC-101"
				/>
			</div>

			<div className="grid gap-2">
				<Label htmlFor="project-description">Beschrijving</Label>
				<Textarea
					id="project-description"
					value={form.description}
					onChange={(e) => onFieldChange('description', e.target.value)}
					placeholder="Optionele beschrijving"
					rows={3}
				/>
			</div>

			{shouldShowProjectActiveCheckbox(isEditing) && (
				<div className="flex items-center gap-2">
					<input
						id="project-active"
						type="checkbox"
						checked={form.is_active}
						onChange={(e) => onFieldChange('is_active', e.target.checked)}
						className="h-4 w-4 rounded border-input"
					/>
					<Label htmlFor="project-active">Actief</Label>
				</div>
			)}
		</div>
	);
}
