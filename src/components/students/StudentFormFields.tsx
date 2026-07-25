import { StudentFormDebtorSection } from '@/components/students/StudentFormDebtorSection';
import { StudentFormModeSection } from '@/components/students/StudentFormModeSection';
import { StudentFormParentSection } from '@/components/students/StudentFormParentSection';
import { StudentFormPersonalSection } from '@/components/students/StudentFormPersonalSection';
import type { StudentFormDialogViewModel } from '@/components/students/useStudentFormDialog';

interface StudentFormFieldsProps {
	vm: StudentFormDialogViewModel;
}

export function StudentFormFields({ vm }: StudentFormFieldsProps) {
	return (
		<div className="space-y-4 py-2">
			<StudentFormModeSection vm={vm} />
			<StudentFormPersonalSection vm={vm} />
			<StudentFormParentSection vm={vm} />
			<StudentFormDebtorSection vm={vm} />
		</div>
	);
}
