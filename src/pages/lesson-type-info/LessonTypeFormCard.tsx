import { LuLoaderCircle } from 'react-icons/lu';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ColorPicker } from '@/components/ui/color-picker';
import { IconPicker } from '@/components/ui/icon-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MUSIC_ICONS } from '@/constants/icons';
import {
	applyDuoLessonToggle,
	applyGroupLessonToggle,
	shouldDisableLessonTypeSubmit,
	shouldShowLessonTypeSavingLabel,
	updateLessonTypeFormActive,
	updateLessonTypeFormColor,
	updateLessonTypeFormCostCenter,
	updateLessonTypeFormDescription,
	updateLessonTypeFormIcon,
	updateLessonTypeFormName,
} from '@/lib/lesson-types/lessonTypeFormCardHelpers';
import type { LessonTypeFormState } from '@/types/lesson-agreements';

interface LessonTypeFormCardProps {
	form: LessonTypeFormState;
	setForm: (form: LessonTypeFormState) => void;
	onSubmit: () => void;
	canSubmit: boolean;
	submitting: boolean;
	submitLabel: string;
	savingLabel: string;
}

export function LessonTypeFormCard({
	form,
	setForm,
	onSubmit,
	canSubmit,
	submitting,
	submitLabel,
	savingLabel,
}: LessonTypeFormCardProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Lessoort</CardTitle>
				<CardDescription></CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="space-y-2">
					<Label htmlFor="lesson-type-name">
						Naam <span className="text-destructive">*</span>
					</Label>
					<Input
						id="lesson-type-name"
						value={form.name}
						onChange={(e) => setForm(updateLessonTypeFormName(form, e.target.value))}
						placeholder="bijv. Gitaar"
					/>
				</div>

				<div className="space-y-2">
					<Label htmlFor="lesson-type-description">Beschrijving</Label>
					<Input
						id="lesson-type-description"
						value={form.description}
						onChange={(e) => setForm(updateLessonTypeFormDescription(form, e.target.value))}
						placeholder="Optionele beschrijving"
					/>
				</div>

				<div className="grid grid-cols-2 gap-4">
					<div className="space-y-2">
						<Label htmlFor="lesson-type-icon">
							Icoon <span className="text-destructive">*</span>
						</Label>
						<IconPicker
							value={form.icon || undefined}
							onChange={(iconName) => setForm(updateLessonTypeFormIcon(form, iconName))}
							icons={MUSIC_ICONS}
						/>
					</div>
					<div className="space-y-2">
						<Label>
							Kleur <span className="text-destructive">*</span>
						</Label>
						<ColorPicker
							value={form.color || undefined}
							onChange={(hex) => setForm(updateLessonTypeFormColor(form, hex))}
						/>
					</div>
				</div>

				<div className="space-y-2">
					<Label htmlFor="lesson-type-cost-center">Kostenplaats</Label>
					<Input
						id="lesson-type-cost-center"
						value={form.cost_center}
						onChange={(e) => setForm(updateLessonTypeFormCostCenter(form, e.target.value))}
						placeholder="Voor boekhouding"
					/>
				</div>

				<div className="flex flex-wrap items-center gap-6">
					<label className="flex cursor-pointer items-center gap-2">
						<input
							type="checkbox"
							checked={form.is_group_lesson}
							onChange={(e) => setForm(applyGroupLessonToggle(form, e.target.checked))}
							className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
						/>
						<span className="text-sm font-medium">Groepsles</span>
					</label>
					<label className="flex cursor-pointer items-center gap-2">
						<input
							type="checkbox"
							checked={form.is_duo_lesson}
							onChange={(e) => setForm(applyDuoLessonToggle(form, e.target.checked))}
							className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
						/>
						<span className="text-sm font-medium">Duo-les (2 leerlingen)</span>
					</label>
					<label className="flex cursor-pointer items-center gap-2">
						<input
							type="checkbox"
							checked={form.is_active}
							onChange={(e) => setForm(updateLessonTypeFormActive(form, e.target.checked))}
							className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
						/>
						<span className="text-sm font-medium">Actief</span>
					</label>
				</div>

				<div className="flex gap-2 pt-4">
					<Button
						variant="default"
						onClick={onSubmit}
						disabled={shouldDisableLessonTypeSubmit(canSubmit, submitting)}
					>
						{shouldShowLessonTypeSavingLabel(submitting) ? (
							<>
								<LuLoaderCircle className="mr-2 h-4 w-4 animate-spin" />
								{savingLabel}
							</>
						) : (
							submitLabel
						)}
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
