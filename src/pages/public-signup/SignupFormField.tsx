import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SignupFormFieldProps {
	label: string;
	value: string;
	onChange: (value: string) => void;
	type?: string;
	required?: boolean;
}

export function SignupFormField({ label, value, onChange, type = 'text', required }: SignupFormFieldProps) {
	return (
		<div>
			<Label>{label}</Label>
			<Input
				className="mt-1"
				type={type}
				value={value}
				onChange={(event) => onChange(event.target.value)}
				required={required}
			/>
		</div>
	);
}
