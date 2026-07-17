import { supabase } from '@/integrations/supabase/client';

export interface SepaMandateOption {
	id: string;
	mandate_reference: string;
	iban: string;
	account_holder: string;
	status: string;
}

export function maskSepaIban(iban: string): string {
	return iban.length > 8 ? `${iban.slice(0, 4)} •••• ${iban.slice(-4)}` : iban;
}

function resolveAutoSelectedSepaMandateId(
	mandates: SepaMandateOption[],
	currentSepaMandateId: string | null,
): string | null {
	if (currentSepaMandateId) return currentSepaMandateId;
	if (mandates.length === 1) return mandates[0]?.id ?? null;
	return null;
}

export function shouldLoadSepaMandates(paymentMethod: string, studentUserId: string | null): studentUserId is string {
	return paymentMethod === 'sepa' && studentUserId !== null;
}

export type PaymentMethodValue = 'stripe' | 'sepa' | 'manual';

export type SepaMandateFieldView = 'loading' | 'empty' | 'select';

export function resolveSepaMandateFieldView(loading: boolean, mandateCount: number): SepaMandateFieldView {
	if (loading) return 'loading';
	if (mandateCount === 0) return 'empty';
	return 'select';
}

export function handlePaymentMethodSelection(
	value: string,
	onPaymentMethodChange: (value: PaymentMethodValue) => void,
	onSepaMandateIdChange: (value: string | null) => void,
): void {
	onPaymentMethodChange(value as PaymentMethodValue);
	if (value !== 'sepa') onSepaMandateIdChange(null);
}

export function applyLoadedSepaMandates(
	mandates: SepaMandateOption[],
	sepaMandateId: string | null,
	onSepaMandateIdChange: (value: string | null) => void,
): void {
	const autoSelectedId = resolveAutoSelectedSepaMandateId(mandates, sepaMandateId);
	if (autoSelectedId && autoSelectedId !== sepaMandateId) {
		onSepaMandateIdChange(autoSelectedId);
	}
}

export async function fetchSepaMandateOptions(studentUserId: string): Promise<SepaMandateOption[]> {
	const { data } = await supabase
		.from('sepa_mandates')
		.select('id, mandate_reference, iban, account_holder, status')
		.eq('student_user_id', studentUserId)
		.in('status', ['active', 'pending'])
		.order('created_at', { ascending: false });

	return data ?? [];
}
