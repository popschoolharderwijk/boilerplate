import type { FormEvent } from 'react';
import { ScheduleTrialLessonFormFields } from '@/components/trial-lessons/ScheduleTrialLessonFormFields';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useScheduleTrialLessonDialog } from '@/hooks/useScheduleTrialLessonDialog';

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	signupRequest?: Parameters<typeof useScheduleTrialLessonDialog>[0]['signupRequest'];
	onScheduled?: () => void;
}

export function ScheduleTrialLessonDialog({ open, onOpenChange, signupRequest, onScheduled }: Props) {
	const dialog = useScheduleTrialLessonDialog({ open, signupRequest, onOpenChange, onScheduled });

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle>Proefles inplannen</DialogTitle>
					<DialogDescription>{dialog.dialogDescription}</DialogDescription>
				</DialogHeader>
				<form onSubmit={(e: FormEvent) => void dialog.handleSubmit(e)} className="space-y-3">
					<ScheduleTrialLessonFormFields
						hasSignupRequest={!!signupRequest}
						studentFirstName={dialog.studentFirstName}
						studentLastName={dialog.studentLastName}
						studentEmail={dialog.studentEmail}
						fromDate={dialog.fromDate}
						toDate={dialog.toDate}
						duration={dialog.duration}
						notes={dialog.notes}
						loading={dialog.loading}
						submitting={dialog.submitting}
						selected={dialog.selected}
						slotsGroupedByDate={dialog.slotsGroupedByDate}
						teachers={dialog.teachers}
						onStudentFirstNameChange={dialog.setStudentFirstName}
						onStudentLastNameChange={dialog.setStudentLastName}
						onStudentEmailChange={dialog.setStudentEmail}
						onFromDateChange={dialog.setFromDate}
						onToDateChange={dialog.setToDate}
						onDurationChange={dialog.setDuration}
						onNotesChange={dialog.setNotes}
						onSelectSlot={dialog.setSelected}
						onCancel={() => onOpenChange(false)}
					/>
				</form>
			</DialogContent>
		</Dialog>
	);
}
