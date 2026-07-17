import { LessonAgreementItem } from '@/components/students/LessonAgreementItem';
import { Badge } from '@/components/ui/badge';
import {
	collectMyStudentLessonTypes,
	hasMyStudentAgreements,
	hasMyStudentLessonTypes,
} from '@/lib/students/myStudentsPageHelpers';
import type { StudentWithAgreements } from '@/types/students';

export function MyStudentsLessonTypesCell({ student }: { student: StudentWithAgreements }) {
	if (!hasMyStudentLessonTypes(student)) {
		return <span className="text-muted-foreground text-sm">-</span>;
	}

	return (
		<div className="flex flex-wrap gap-1">
			{collectMyStudentLessonTypes(student).map((lessonType) => (
				<Badge key={lessonType.key} variant="secondary" className="text-xs">
					{lessonType.name}
				</Badge>
			))}
		</div>
	);
}

export function MyStudentsAgreementsCell({ student }: { student: StudentWithAgreements }) {
	if (!hasMyStudentAgreements(student)) {
		return <span className="text-muted-foreground text-sm">-</span>;
	}

	return (
		<div className="flex flex-wrap gap-2">
			{student.agreements.map((agreement) => (
				<LessonAgreementItem key={agreement.id} agreement={agreement} className="flex-shrink-0" />
			))}
		</div>
	);
}
