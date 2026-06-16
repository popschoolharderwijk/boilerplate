import { Card, CardContent } from '@/components/ui/card';
import type { SlotWithStatus } from '@/lib/agreementSlots';
import { DAY_NAMES } from '@/lib/date/day-index';
import { formatTime } from '@/lib/time/time-format';
import type { WizardInitialAgreement, WizardLessonTypeInfo, WizardTeacherInfo } from '@/types/lesson-agreements';
import type { UserOptional } from '@/types/users';
import {
	ConfirmStudentRow,
	formatWizardPeriodRange,
	isWizardPeriodChanged,
	isWizardSlotChanged,
	isWizardTeacherChanged,
} from './confirmStepShared';
import {
	ConfirmInitialAgreementRows,
	ConfirmSelectedLessonTypeRows,
	ConfirmSlotDiffValue,
	ConfirmStepDiffRow,
	ConfirmTeacherDiffValue,
} from './confirmStepSummaryRows';

interface ConfirmStepDiffViewProps {
	initialAgreement: WizardInitialAgreement;
	loadedPeriod: { start_date: string; end_date: string | null } | null;
	selectedUser: UserOptional | null;
	selectedLessonType: WizardLessonTypeInfo | undefined;
	startDate: string;
	endDate: string;
	selectedTeacherUserId: string | null;
	selectedTeacher: WizardTeacherInfo | undefined;
	effectiveSlot: SlotWithStatus | null;
}

export function ConfirmStepDiffView({
	initialAgreement,
	loadedPeriod,
	selectedUser,
	selectedLessonType,
	startDate,
	endDate,
	selectedTeacherUserId,
	selectedTeacher,
	effectiveSlot,
}: ConfirmStepDiffViewProps) {
	const periodStart = loadedPeriod?.start_date ?? initialAgreement.start_date ?? '';
	const periodEnd = loadedPeriod?.end_date ?? initialAgreement.end_date;
	const slotChanged = isWizardSlotChanged(initialAgreement, effectiveSlot);

	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
			<Card className="border-muted">
				<CardContent className="p-4">
					<p className="mb-3 text-sm font-semibold text-muted-foreground">Huidige overeenkomst</p>
					<ConfirmStudentRow selectedUser={selectedUser} studentUserId={initialAgreement.student_user_id} />
					<ConfirmInitialAgreementRows agreement={initialAgreement} />
					<ConfirmStepDiffRow
						label="Periode"
						hideIcon
						changed={isWizardPeriodChanged(periodStart, periodEnd, startDate, endDate)}
						oldValue={formatWizardPeriodRange(periodStart, periodEnd)}
					/>
					<ConfirmStepDiffRow
						label="Docent"
						hideIcon
						changed={isWizardTeacherChanged(initialAgreement.teacher_user_id, selectedTeacherUserId)}
						oldValue={
							<ConfirmTeacherDiffValue
								teacher={initialAgreement.teacher}
								href={`/teachers/${initialAgreement.teacher_user_id}`}
							/>
						}
					/>
					<ConfirmStepDiffRow
						label="Tijdslot"
						hideIcon
						changed={slotChanged}
						oldValue={`${DAY_NAMES[initialAgreement.day_of_week]} om ${formatTime(initialAgreement.start_time)}`}
					/>
				</CardContent>
			</Card>
			<Card>
				<CardContent className="p-4">
					<p className="mb-3 text-sm font-semibold text-primary">Nieuwe overeenkomst</p>
					<ConfirmStudentRow selectedUser={selectedUser} studentUserId={initialAgreement.student_user_id} />
					<ConfirmSelectedLessonTypeRows lessonType={selectedLessonType} />
					<ConfirmStepDiffRow
						label="Periode"
						changed={isWizardPeriodChanged(
							initialAgreement.start_date,
							initialAgreement.end_date,
							startDate,
							endDate,
						)}
						newValue={formatWizardPeriodRange(startDate, endDate)}
					/>
					<ConfirmStepDiffRow
						label="Docent"
						changed={isWizardTeacherChanged(initialAgreement.teacher_user_id, selectedTeacherUserId)}
						newValue={
							<ConfirmTeacherDiffValue
								teacher={selectedTeacher}
								href={selectedTeacher ? `/teachers/${selectedTeacher.userId}` : undefined}
							/>
						}
					/>
					<ConfirmStepDiffRow
						label="Tijdslot"
						changed={slotChanged}
						newValue={<ConfirmSlotDiffValue slot={effectiveSlot} />}
					/>
				</CardContent>
			</Card>
		</div>
	);
}
