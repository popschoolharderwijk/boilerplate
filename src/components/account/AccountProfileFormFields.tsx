import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PhoneInput } from '@/components/ui/phone-input';
import { applyAccountPhoneFieldChange } from '@/lib/account/accountPageHelpers';
import type { AccountFormData, AccountFormErrors } from '@/lib/account/persistence';

interface AccountProfileFormFieldsProps {
	formData: AccountFormData;
	errors: AccountFormErrors;
	saving: boolean;
	onFormDataChange: (data: AccountFormData, errors: AccountFormErrors) => void;
	onSave: (e: React.FormEvent) => void;
}

export function AccountProfileFormFields({
	formData,
	errors,
	saving,
	onFormDataChange,
	onSave,
}: AccountProfileFormFieldsProps) {
	return (
		<form onSubmit={onSave} className="space-y-4">
			<div className="grid grid-cols-2 gap-4">
				<div className="space-y-2">
					<Label htmlFor="first_name">Voornaam</Label>
					<Input
						id="first_name"
						value={formData.first_name}
						onChange={(e) => onFormDataChange({ ...formData, first_name: e.target.value }, errors)}
						disabled={saving}
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor="last_name">Achternaam</Label>
					<Input
						id="last_name"
						value={formData.last_name}
						onChange={(e) => onFormDataChange({ ...formData, last_name: e.target.value }, errors)}
						disabled={saving}
					/>
				</div>
			</div>

			<PhoneInput
				id="phone_number"
				label="Telefoonnummer"
				value={formData.phone_number}
				onChange={(value) => {
					const next = applyAccountPhoneFieldChange(formData, errors, value);
					onFormDataChange(next.formData, next.errors);
				}}
				error={errors.phone_number}
				disabled={saving}
			/>

			<Button type="submit" disabled={saving}>
				{saving ? 'Opslaan...' : 'Opslaan'}
			</Button>
		</form>
	);
}
