import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PhoneInput } from '@/components/ui/phone-input';
import { SubmitButton } from '@/components/ui/submit-button';
import { Textarea } from '@/components/ui/textarea';

interface TeacherProfileFormProps {
	firstName: string;
	lastName: string;
	phoneNumber: string;
	bio: string;
	hasVog: boolean;
	vogExpiresAt: string;
	canEdit: boolean;
	saving: boolean;
	onFirstNameChange: (value: string) => void;
	onLastNameChange: (value: string) => void;
	onPhoneNumberChange: (value: string) => void;
	onBioChange: (value: string) => void;
	onHasVogChange: (value: boolean) => void;
	onVogExpiresAtChange: (value: string) => void;
	onSave: () => void;
}

export function TeacherProfileForm({
	firstName,
	lastName,
	phoneNumber,
	bio,
	hasVog,
	vogExpiresAt,
	canEdit,
	saving,
	onFirstNameChange,
	onLastNameChange,
	onPhoneNumberChange,
	onBioChange,
	onHasVogChange,
	onVogExpiresAtChange,
	onSave,
}: TeacherProfileFormProps) {
	return (
		<div className="space-y-4">
			<div className="grid gap-4 sm:grid-cols-2">
				<div className="space-y-2">
					<Label htmlFor="first-name">Voornaam</Label>
					<Input
						id="first-name"
						value={firstName}
						onChange={(e) => onFirstNameChange(e.target.value)}
						disabled={!canEdit}
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor="last-name">Achternaam</Label>
					<Input
						id="last-name"
						value={lastName}
						onChange={(e) => onLastNameChange(e.target.value)}
						disabled={!canEdit}
					/>
				</div>
			</div>
			<PhoneInput
				id="phone-number"
				label="Telefoonnummer"
				value={phoneNumber}
				onChange={onPhoneNumberChange}
				disabled={!canEdit}
			/>
			<div className="space-y-2">
				<Label htmlFor="bio">Biografie</Label>
				<Textarea
					id="bio"
					value={bio}
					onChange={(e) => onBioChange(e.target.value)}
					placeholder="Korte beschrijving van jezelf..."
					rows={3}
					disabled={!canEdit}
					className="resize-none"
				/>
			</div>
			<div className="space-y-2">
				<label className="flex items-center gap-2 cursor-pointer select-none">
					<input
						type="checkbox"
						checked={hasVog}
						onChange={(e) => onHasVogChange(e.target.checked)}
						disabled={!canEdit}
						className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
					/>
					<span className="text-sm font-medium">VOG aanwezig</span>
				</label>
				{hasVog && (
					<div className="space-y-2">
						<Label htmlFor="vog-expires-at">VOG geldig tot</Label>
						<Input
							id="vog-expires-at"
							type="date"
							value={vogExpiresAt}
							onChange={(e) => onVogExpiresAtChange(e.target.value)}
							disabled={!canEdit}
							className="max-w-xs"
						/>
					</div>
				)}
			</div>
			{canEdit && (
				<SubmitButton onClick={onSave} loading={saving} size="sm" loadingLabel="Opslaan...">
					Opslaan
				</SubmitButton>
			)}
		</div>
	);
}
