import { DatePicker } from '@/components/ui/date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TimeInput } from '@/components/ui/time-input';
import { frequencyOptions } from '@/lib/frequencies';
import type { LessonFrequency } from '@/types/lesson-agreements';

interface AgendaEventFormScheduleProps {
	startDate: string | null;
	setStartDate: (value: string | null) => void;
	setEndDate: (value: string | null) => void;
	startTime: string;
	setStartTime: (value: string) => void;
	endTime: string;
	setEndTime: (value: string) => void;
	isAllDay: boolean;
	setIsAllDay: (value: boolean) => void;
	recurring: boolean;
	setRecurring: (value: boolean) => void;
	recurringFrequency: LessonFrequency;
	setRecurringFrequency: (value: LessonFrequency) => void;
	recurringEndDate: string | null;
	setRecurringEndDate: (value: string | null) => void;
	isCancelledEvent: boolean;
}

export function AgendaEventFormSchedule({
	startDate,
	setStartDate,
	setEndDate,
	startTime,
	setStartTime,
	endTime,
	setEndTime,
	isAllDay,
	setIsAllDay,
	recurring,
	setRecurring,
	recurringFrequency,
	setRecurringFrequency,
	recurringEndDate,
	setRecurringEndDate,
	isCancelledEvent,
}: AgendaEventFormScheduleProps) {
	return (
		<>
			<div className="flex flex-wrap items-end gap-2">
				<div className="flex-1 min-w-[140px]">
					<DatePicker
						value={startDate}
						onChange={(date) => {
							setStartDate(date);
							setEndDate(date);
						}}
						disabled={isCancelledEvent}
					/>
				</div>
				{!isAllDay && (
					<>
						<TimeInput
							value={startTime}
							onChange={(e) => setStartTime(e.target.value)}
							disabled={isCancelledEvent}
							className="w-20"
						/>
						<span className="text-muted-foreground pb-2">–</span>
						<TimeInput
							value={endTime}
							onChange={(e) => setEndTime(e.target.value)}
							disabled={isCancelledEvent}
							className="w-20"
						/>
					</>
				)}
			</div>

			<div className="flex flex-wrap items-center gap-4">
				<label className="flex items-center gap-2 cursor-pointer">
					<input
						type="checkbox"
						id="allDay"
						checked={isAllDay}
						onChange={(e) => setIsAllDay(e.target.checked)}
						disabled={isCancelledEvent}
						className="h-4 w-4"
					/>
					<span className="text-sm">Hele dag</span>
				</label>
				<Select
					value={recurring ? recurringFrequency : 'none'}
					onValueChange={(val) => {
						if (val === 'none') {
							setRecurring(false);
							return;
						}
						setRecurring(true);
						setRecurringFrequency(val as LessonFrequency);
					}}
					disabled={isCancelledEvent}
				>
					<SelectTrigger className="w-[150px]">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="none">Herhaalt niet</SelectItem>
						{frequencyOptions.map((opt) => (
							<SelectItem key={opt.value} value={opt.value}>
								{opt.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				{recurring && (
					<div className="flex items-center gap-2">
						<span className="text-sm text-muted-foreground">tot</span>
						<DatePicker
							value={recurringEndDate}
							onChange={setRecurringEndDate}
							disabled={isCancelledEvent}
						/>
					</div>
				)}
			</div>
		</>
	);
}
