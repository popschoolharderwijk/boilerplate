import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { AvailabilityTimeForm } from '@/lib/teachers/teacherAvailabilitySectionHelpers';

interface TeacherAvailabilitySlotTimeFieldsProps {
	form: AvailabilityTimeForm;
	startTimeOptions: string[];
	endTimeOptions: string[];
	onFormChange: (form: AvailabilityTimeForm) => void;
}

export function TeacherAvailabilitySlotTimeFields({
	form,
	startTimeOptions,
	endTimeOptions,
	onFormChange,
}: TeacherAvailabilitySlotTimeFieldsProps) {
	return (
		<div className="grid grid-cols-2 gap-4">
			<div className="space-y-2">
				<Label>Starttijd</Label>
				<Select value={form.start_time} onValueChange={(value) => onFormChange({ ...form, start_time: value })}>
					<SelectTrigger>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{startTimeOptions.map((time) => (
							<SelectItem key={time} value={time}>
								{time}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
			<div className="space-y-2">
				<Label>Eindtijd</Label>
				<Select value={form.end_time} onValueChange={(value) => onFormChange({ ...form, end_time: value })}>
					<SelectTrigger>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{endTimeOptions.map((time) => (
							<SelectItem key={time} value={time}>
								{time}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
		</div>
	);
}
