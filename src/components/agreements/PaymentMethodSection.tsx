import { useEffect, useState } from 'react';
import { PaymentMethodOptions } from '@/components/agreements/PaymentMethodOptions';
import { SepaMandateField } from '@/components/agreements/SepaMandateField';
import {
	applyLoadedSepaMandates,
	fetchSepaMandateOptions,
	type PaymentMethodValue,
	type SepaMandateOption,
	shouldLoadSepaMandates,
} from '@/lib/agreements/paymentMethodSectionHelpers';

interface Props {
	paymentMethod: PaymentMethodValue;
	sepaMandateId: string | null;
	studentUserId: string | null;
	onPaymentMethodChange: (value: PaymentMethodValue) => void;
	onSepaMandateIdChange: (value: string | null) => void;
}

export function PaymentMethodSection({
	paymentMethod,
	sepaMandateId,
	studentUserId,
	onPaymentMethodChange,
	onSepaMandateIdChange,
}: Props) {
	const [mandates, setMandates] = useState<SepaMandateOption[]>([]);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (!shouldLoadSepaMandates(paymentMethod, studentUserId)) {
			setMandates([]);
			return;
		}

		setLoading(true);
		void fetchSepaMandateOptions(studentUserId).then((data) => {
			setMandates(data);
			setLoading(false);
			applyLoadedSepaMandates(data, sepaMandateId, onSepaMandateIdChange);
		});
	}, [paymentMethod, studentUserId, sepaMandateId, onSepaMandateIdChange]);

	return (
		<div className="rounded-lg border bg-muted/30 p-4 space-y-4">
			<div>
				<h4 className="font-medium mb-1">Betaalmethode</h4>
				<p className="text-sm text-muted-foreground">Kies hoe de leerling deze overeenkomst betaalt.</p>
			</div>

			<PaymentMethodOptions
				paymentMethod={paymentMethod}
				onPaymentMethodChange={onPaymentMethodChange}
				onSepaMandateIdChange={onSepaMandateIdChange}
			/>

			{paymentMethod === 'sepa' && (
				<SepaMandateField
					loading={loading}
					mandates={mandates}
					sepaMandateId={sepaMandateId}
					onSepaMandateIdChange={onSepaMandateIdChange}
				/>
			)}
		</div>
	);
}
