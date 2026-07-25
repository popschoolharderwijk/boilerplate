import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { getCancelStudentLabel, isConfirmCancelTeacherDisabled } from '@/lib/agenda/confirmCancelDialogHelpers';
import type { CancellationType } from '@/types/agenda-events';

interface ConfirmCancelTypeOptionsProps {
	isGroup: boolean;
	cancelAll: boolean;
	cancellationType: CancellationType;
	onCancellationTypeChange: (value: CancellationType) => void;
}

export function ConfirmCancelTypeOptions({
	isGroup,
	cancelAll,
	cancellationType,
	onCancellationTypeChange,
}: ConfirmCancelTypeOptionsProps) {
	const teacherDisabled = isConfirmCancelTeacherDisabled(isGroup, cancelAll);

	return (
		<RadioGroup
			value={cancellationType}
			onValueChange={(value) => onCancellationTypeChange(value as CancellationType)}
			className="gap-3 py-2"
		>
			<div className="flex items-center space-x-2">
				<RadioGroupItem value="student" id="cancel-student" />
				<Label htmlFor="cancel-student" className="cursor-pointer">
					{getCancelStudentLabel(isGroup, cancelAll)}
				</Label>
			</div>
			<div className="flex items-center space-x-2">
				<RadioGroupItem value="teacher" id="cancel-teacher" disabled={teacherDisabled} />
				<Label
					htmlFor="cancel-teacher"
					className={`cursor-pointer ${teacherDisabled ? 'text-muted-foreground' : ''}`}
				>
					Docent kan niet (inhalen vereist)
				</Label>
			</div>
		</RadioGroup>
	);
}
