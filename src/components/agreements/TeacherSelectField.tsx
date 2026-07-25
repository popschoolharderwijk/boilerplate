import { LuTriangleAlert } from 'react-icons/lu';
import { resolveTeacherSelectionId } from '@/components/agreements/teacherSlotStepContentHelpers';
import { Label } from '@/components/ui/label';
import { UserSelectSingle } from '@/components/ui/user-select';

interface TeacherOption {
	id: string;
	userId: string;
	firstName: string | null;
	lastName: string | null;
	email: string | null;
	avatarUrl: string | null;
}

interface TeacherSelectFieldProps {
	teachers: TeacherOption[];
	selectedTeacher: TeacherOption | undefined;
	excludeUserIds: string[];
	includeUserIds?: string[];
	isTeacherOwnStudent: boolean;
	onTeacherChange: (teacherId: string | null) => void;
}

export function TeacherSelectField({
	teachers,
	selectedTeacher,
	excludeUserIds,
	includeUserIds,
	isTeacherOwnStudent,
	onTeacherChange,
}: TeacherSelectFieldProps) {
	return (
		<div className="space-y-2">
			<Label>Docent</Label>
			<UserSelectSingle
				filter="teachers"
				value={selectedTeacher?.userId ?? null}
				onChange={(user) => {
					onTeacherChange(resolveTeacherSelectionId(teachers, user));
				}}
				excludeUserIds={excludeUserIds}
				includeUserIds={includeUserIds}
				placeholder="Selecteer docent..."
			/>
			{isTeacherOwnStudent && (
				<p className="text-sm text-destructive flex items-center gap-1 mt-2">
					<LuTriangleAlert className="h-4 w-4" />
					Een docent kan niet zijn eigen leerling zijn.
				</p>
			)}
		</div>
	);
}
