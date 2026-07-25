import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Label } from '@/components/ui/label';

interface PeriodPresetControlsProps<T extends string> {
	preset: T;
	presets: readonly T[];
	labels: Record<T, string>;
	onPresetChange: (preset: T) => void;
	startDate: string;
	endDate: string;
	onStartDateChange: (value: string) => void;
	onEndDateChange: (value: string) => void;
	customPreset?: T;
}

export function PeriodPresetControls<T extends string>({
	preset,
	presets,
	labels,
	onPresetChange,
	startDate,
	endDate,
	onStartDateChange,
	onEndDateChange,
	customPreset = 'custom' as T,
}: PeriodPresetControlsProps<T>) {
	return (
		<>
			<div className="flex flex-wrap gap-2">
				{presets.map((p) => (
					<Button
						key={p}
						variant={preset === p ? 'default' : 'outline'}
						size="sm"
						onClick={() => onPresetChange(p)}
					>
						{labels[p]}
					</Button>
				))}
			</div>

			{preset === customPreset && (
				<div className="flex flex-wrap items-end gap-4">
					<div className="space-y-1.5">
						<Label>Startdatum</Label>
						<DatePicker value={startDate} onChange={(v) => onStartDateChange(v || '')} />
					</div>
					<div className="space-y-1.5">
						<Label>Einddatum</Label>
						<DatePicker value={endDate} onChange={(v) => onEndDateChange(v || '')} />
					</div>
				</div>
			)}
		</>
	);
}
