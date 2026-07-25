import { LuLoader } from 'react-icons/lu';
import { TrialLessonSlotPicker } from '@/components/trial-lessons/TrialLessonSlotPicker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { FreeSlotForTeacher } from '@/lib/agreementSlots';
import type { TrialLessonSchedulingTeacher } from '@/lib/trial-lessons/loadTrialLessonSchedulingData';

interface ScheduleTrialLessonStudentFieldsProps {
	studentFirstName: string;
	studentLastName: string;
	studentEmail: string;
	onStudentFirstNameChange: (value: string) => void;
	onStudentLastNameChange: (value: string) => void;
	onStudentEmailChange: (value: string) => void;
}

function ScheduleTrialLessonStudentFields({
	studentFirstName,
	studentLastName,
	studentEmail,
	onStudentFirstNameChange,
	onStudentLastNameChange,
	onStudentEmailChange,
}: ScheduleTrialLessonStudentFieldsProps) {
	return (
		<>
			<div className="grid grid-cols-2 gap-3">
				<div>
					<Label>Voornaam</Label>
					<Input
						value={studentFirstName}
						onChange={(e) => onStudentFirstNameChange(e.target.value)}
						required
					/>
				</div>
				<div>
					<Label>Achternaam</Label>
					<Input value={studentLastName} onChange={(e) => onStudentLastNameChange(e.target.value)} required />
				</div>
			</div>
			<div>
				<Label>E-mail</Label>
				<Input
					type="email"
					value={studentEmail}
					onChange={(e) => onStudentEmailChange(e.target.value)}
					required
				/>
			</div>
		</>
	);
}

interface ScheduleTrialLessonDateFieldsProps {
	fromDate: string;
	toDate: string;
	duration: number;
	onFromDateChange: (value: string) => void;
	onToDateChange: (value: string) => void;
	onDurationChange: (value: number) => void;
}

function ScheduleTrialLessonDateFields({
	fromDate,
	toDate,
	duration,
	onFromDateChange,
	onToDateChange,
	onDurationChange,
}: ScheduleTrialLessonDateFieldsProps) {
	return (
		<div className="grid grid-cols-3 gap-3">
			<div>
				<Label>Van</Label>
				<Input type="date" value={fromDate} onChange={(e) => onFromDateChange(e.target.value)} required />
			</div>
			<div>
				<Label>Tot</Label>
				<Input type="date" value={toDate} onChange={(e) => onToDateChange(e.target.value)} required />
			</div>
			<div>
				<Label>Duur (min)</Label>
				<Input
					type="number"
					min={15}
					step={15}
					value={duration}
					onChange={(e) => onDurationChange(Number(e.target.value))}
					required
				/>
			</div>
		</div>
	);
}

interface ScheduleTrialLessonSlotsPanelProps {
	loading: boolean;
	slotsGroupedByDate: Map<string, FreeSlotForTeacher[]>;
	teachers: Map<string, TrialLessonSchedulingTeacher>;
	selected: FreeSlotForTeacher | null;
	onSelectSlot: (slot: FreeSlotForTeacher) => void;
}

function ScheduleTrialLessonSlotsPanel({
	loading,
	slotsGroupedByDate,
	teachers,
	selected,
	onSelectSlot,
}: ScheduleTrialLessonSlotsPanelProps) {
	return (
		<div>
			<Label>Beschikbare tijdsloten</Label>
			<div className="rounded-md border">
				<ScrollArea className="h-72">
					{loading ? (
						<div className="flex items-center justify-center gap-2 p-6 text-sm text-muted-foreground">
							<LuLoader className="h-4 w-4 animate-spin" />
							Slots laden…
						</div>
					) : slotsGroupedByDate.size === 0 ? (
						<div className="p-6 text-center text-sm text-muted-foreground">
							Geen vrije tijdsloten in deze periode.
						</div>
					) : (
						<TrialLessonSlotPicker
							slotsGroupedByDate={slotsGroupedByDate}
							teachers={teachers}
							selected={selected}
							onSelect={onSelectSlot}
						/>
					)}
				</ScrollArea>
			</div>
		</div>
	);
}

interface ScheduleTrialLessonFormActionsProps {
	submitting: boolean;
	hasSelectedSlot: boolean;
	onCancel: () => void;
}

function ScheduleTrialLessonFormActions({
	submitting,
	hasSelectedSlot,
	onCancel,
}: ScheduleTrialLessonFormActionsProps) {
	return (
		<div className="flex justify-end gap-2">
			<Button type="button" variant="outline" onClick={onCancel}>
				Annuleren
			</Button>
			<Button type="submit" disabled={submitting || !hasSelectedSlot}>
				{submitting ? 'Inplannen…' : 'Proefles inplannen'}
			</Button>
		</div>
	);
}

export interface ScheduleTrialLessonFormBodyProps {
	hasSignupRequest: boolean;
	studentFirstName: string;
	studentLastName: string;
	studentEmail: string;
	fromDate: string;
	toDate: string;
	duration: number;
	notes: string;
	loading: boolean;
	submitting: boolean;
	selected: FreeSlotForTeacher | null;
	slotsGroupedByDate: Map<string, FreeSlotForTeacher[]>;
	teachers: Map<string, TrialLessonSchedulingTeacher>;
	onStudentFirstNameChange: (value: string) => void;
	onStudentLastNameChange: (value: string) => void;
	onStudentEmailChange: (value: string) => void;
	onFromDateChange: (value: string) => void;
	onToDateChange: (value: string) => void;
	onDurationChange: (value: number) => void;
	onNotesChange: (value: string) => void;
	onSelectSlot: (slot: FreeSlotForTeacher) => void;
	onCancel: () => void;
}

function ScheduleTrialLessonFormPrimaryFields({
	hasSignupRequest,
	studentFirstName,
	studentLastName,
	studentEmail,
	fromDate,
	toDate,
	duration,
	onStudentFirstNameChange,
	onStudentLastNameChange,
	onStudentEmailChange,
	onFromDateChange,
	onToDateChange,
	onDurationChange,
}: Pick<
	ScheduleTrialLessonFormBodyProps,
	| 'hasSignupRequest'
	| 'studentFirstName'
	| 'studentLastName'
	| 'studentEmail'
	| 'fromDate'
	| 'toDate'
	| 'duration'
	| 'onStudentFirstNameChange'
	| 'onStudentLastNameChange'
	| 'onStudentEmailChange'
	| 'onFromDateChange'
	| 'onToDateChange'
	| 'onDurationChange'
>) {
	return (
		<>
			{!hasSignupRequest && (
				<ScheduleTrialLessonStudentFields
					studentFirstName={studentFirstName}
					studentLastName={studentLastName}
					studentEmail={studentEmail}
					onStudentFirstNameChange={onStudentFirstNameChange}
					onStudentLastNameChange={onStudentLastNameChange}
					onStudentEmailChange={onStudentEmailChange}
				/>
			)}
			<ScheduleTrialLessonDateFields
				fromDate={fromDate}
				toDate={toDate}
				duration={duration}
				onFromDateChange={onFromDateChange}
				onToDateChange={onToDateChange}
				onDurationChange={onDurationChange}
			/>
		</>
	);
}

export function ScheduleTrialLessonFormBody(props: ScheduleTrialLessonFormBodyProps) {
	return (
		<>
			<ScheduleTrialLessonFormPrimaryFields {...props} />
			<ScheduleTrialLessonFormSecondaryFields {...props} />
		</>
	);
}

function ScheduleTrialLessonFormSecondaryFields({
	loading,
	submitting,
	selected,
	slotsGroupedByDate,
	teachers,
	notes,
	onNotesChange,
	onSelectSlot,
	onCancel,
}: Pick<
	ScheduleTrialLessonFormBodyProps,
	| 'loading'
	| 'submitting'
	| 'selected'
	| 'slotsGroupedByDate'
	| 'teachers'
	| 'notes'
	| 'onNotesChange'
	| 'onSelectSlot'
	| 'onCancel'
>) {
	return (
		<>
			<ScheduleTrialLessonSlotsPanel
				loading={loading}
				slotsGroupedByDate={slotsGroupedByDate}
				teachers={teachers}
				selected={selected}
				onSelectSlot={onSelectSlot}
			/>
			<div>
				<Label>Notitie</Label>
				<Input value={notes} onChange={(e) => onNotesChange(e.target.value)} />
			</div>
			<ScheduleTrialLessonFormActions submitting={submitting} hasSelectedSlot={!!selected} onCancel={onCancel} />
		</>
	);
}
