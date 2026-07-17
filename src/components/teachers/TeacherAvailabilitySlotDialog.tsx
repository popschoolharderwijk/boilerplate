import {
	TeacherAvailabilitySlotDeleteButton,
	TeacherAvailabilitySlotDialogActions,
} from '@/components/teachers/TeacherAvailabilitySlotDialogActions';
import { TeacherAvailabilitySlotDialogDescription } from '@/components/teachers/TeacherAvailabilitySlotDialogDescription';
import { TeacherAvailabilitySlotTimeFields } from '@/components/teachers/TeacherAvailabilitySlotTimeFields';
import type { TeacherAvailabilitySectionViewModel } from '@/components/teachers/useTeacherAvailabilitySection';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DAY_NAMES_DISPLAY } from '@/lib/date/day-index';
import {
	getAvailabilityDialogDescription,
	getAvailabilityDialogTitle,
	getAvailabilityEndTimeOptions,
} from '@/lib/teachers/teacherAvailabilitySectionHelpers';

const dayNames = DAY_NAMES_DISPLAY;

interface TeacherAvailabilitySlotDialogProps {
	vm: TeacherAvailabilitySectionViewModel;
}

export function TeacherAvailabilitySlotDialog({ vm }: TeacherAvailabilitySlotDialogProps) {
	const {
		canEdit,
		timeSlots,
		addDialogOpen,
		selectedSlot,
		editingBlock,
		form,
		setForm,
		closeDialog,
		handleAdd,
		handleUpdate,
		handleDelete,
		handleDialogOpenChange,
	} = vm;

	if (!canEdit) return null;

	const dialogDescription = getAvailabilityDialogDescription(selectedSlot, editingBlock, dayNames);
	const startTimeOptions = timeSlots.slice(0, -1);
	const endTimeOptions = getAvailabilityEndTimeOptions(form.start_time, timeSlots);

	return (
		<Dialog open={addDialogOpen} onOpenChange={handleDialogOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{getAvailabilityDialogTitle(editingBlock)}</DialogTitle>
					<DialogDescription>
						<TeacherAvailabilitySlotDialogDescription description={dialogDescription} />
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-4 py-4">
					<TeacherAvailabilitySlotTimeFields
						form={form}
						startTimeOptions={startTimeOptions}
						endTimeOptions={endTimeOptions}
						onFormChange={setForm}
					/>
					{editingBlock && (
						<TeacherAvailabilitySlotDeleteButton onDelete={() => void handleDelete(editingBlock.id)} />
					)}
				</div>
				<TeacherAvailabilitySlotDialogActions
					isEditing={Boolean(editingBlock)}
					onClose={closeDialog}
					onSave={() => void handleUpdate()}
					onAdd={() => void handleAdd()}
				/>
			</DialogContent>
		</Dialog>
	);
}
