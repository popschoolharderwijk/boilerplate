import { TeacherSlotStepContent } from '@/components/agreements/TeacherSlotStepContent';
import type { LessonGroupWizardState } from '@/components/lesson-groups/wizard/useLessonGroupWizard';

interface LessonGroupTeacherStepProps {
	wizard: LessonGroupWizardState;
}

export function LessonGroupTeacherStep({ wizard }: LessonGroupTeacherStepProps) {
	const { teachers, selectedTeacher, slots, loadingSlots, form, formUpdaters, handleSlotClick } = wizard;

	if (teachers.length === 0) {
		return (
			<div className="space-y-2 py-2">
				<p className="text-sm text-muted-foreground">
					Geen actieve docenten gevonden die deze lessoort aanbieden. Koppel het lestype eerst aan een docent.
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-2 py-2">
			<TeacherSlotStepContent
				teachers={teachers}
				selectedTeacher={selectedTeacher}
				includeUserIds={teachers.map((t) => t.userId)}
				slotsWithStatus={slots}
				selectedSlot={form.slot}
				loadingStep3={loadingSlots}
				isTeacherOwnStudent={false}
				onTeacherChange={formUpdaters.setTeacherUserId}
				onSlotClick={handleSlotClick}
			/>
		</div>
	);
}
