import { useEffect, useState } from 'react';
import { LuSave } from 'react-icons/lu';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAccountingSettings } from '@/hooks/useAccounting';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import type { AccountingSettings } from '@/lib/accounting/types';

export function AccountingSettingsManager() {
	const { isAdmin, isSiteAdmin } = useAuth();
	const canEdit = isAdmin || isSiteAdmin;
	const { settings, loading, reload } = useAccountingSettings();
	const [form, setForm] = useState<AccountingSettings | null>(null);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		if (settings) setForm(settings as AccountingSettings);
	}, [settings]);

	if (loading || !form) {
		return (
			<Card>
				<CardContent className="py-8 text-center text-muted-foreground">Laden...</CardContent>
			</Card>
		);
	}

	const update = <K extends keyof AccountingSettings>(key: K, value: AccountingSettings[K]) => {
		setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
	};

	const handleSave = async () => {
		if (!form || !canEdit) return;
		setSaving(true);
		const { error } = await supabase
			.from('accounting_settings')
			.update({
				journal_code_memoriaal: form.journal_code_memoriaal,
				journal_code_bank: form.journal_code_bank,
				account_debiteuren: form.account_debiteuren,
				account_omzet_under_21: form.account_omzet_under_21,
				account_omzet_21_plus: form.account_omzet_21_plus,
				account_btw_21: form.account_btw_21,
				account_bank_stripe: form.account_bank_stripe,
				account_bank_sepa: form.account_bank_sepa,
				btw_code_21: form.btw_code_21,
				btw_code_exempt: form.btw_code_exempt,
				currency: form.currency,
				school_year_start_month: form.school_year_start_month,
				description_template: form.description_template,
				payment_provider: form.payment_provider,
				sepa_creditor_name: form.sepa_creditor_name,
				sepa_creditor_iban: form.sepa_creditor_iban,
				sepa_creditor_bic: form.sepa_creditor_bic,
				sepa_creditor_id: form.sepa_creditor_id,
				sepa_collection_day: form.sepa_collection_day,
				sepa_remittance_template: form.sepa_remittance_template,
				sepa_mandate_prefix: form.sepa_mandate_prefix,
				company_name: form.company_name,
				company_address: form.company_address,
				company_postcode: form.company_postcode,
				company_city: form.company_city,
				company_kvk: form.company_kvk,
				company_btw_nummer: form.company_btw_nummer,
				company_iban: form.company_iban,
				company_email: form.company_email,
				company_phone: form.company_phone,
				company_logo_url: form.company_logo_url,
				invoice_number_prefix: form.invoice_number_prefix,
				invoice_payment_term_days: form.invoice_payment_term_days,
				invoice_footer_text: form.invoice_footer_text,
			})
			.eq('id', true);
		setSaving(false);
		if (error) {
			toast.error(`Opslaan mislukt: ${error.message}`);
			return;
		}
		toast.success('Boekhoud-instellingen opgeslagen');
		reload();
	};

	const field = (label: string, key: keyof AccountingSettings, placeholder?: string) => (
		<div className="space-y-1.5">
			<Label htmlFor={`acc-${key}`}>{label}</Label>
			<Input
				id={`acc-${key}`}
				value={String(form[key] ?? '')}
				placeholder={placeholder}
				disabled={!canEdit}
				onChange={(e) => update(key, e.target.value as AccountingSettings[typeof key])}
			/>
		</div>
	);

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>Dagboeken</CardTitle>
					<CardDescription>Exact Online dagboek-codes</CardDescription>
				</CardHeader>
				<CardContent className="grid gap-4 sm:grid-cols-2">
					{field('Memoriaal-dagboek', 'journal_code_memoriaal', 'bv. 90')}
					{field('Bank-dagboek', 'journal_code_bank', 'bv. 20')}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Grootboekrekeningen</CardTitle>
					<CardDescription>Rekeningnummers zoals ingesteld in Exact</CardDescription>
				</CardHeader>
				<CardContent className="grid gap-4 sm:grid-cols-2">
					{field('Debiteuren', 'account_debiteuren', 'bv. 1300')}

					{field('Bank SEPA-incasso', 'account_bank_sepa', 'bv. 1102')}
					{field('Omzet <21 (vrijgesteld)', 'account_omzet_under_21', 'bv. 8000')}
					{field('Omzet 21+ (excl. BTW)', 'account_omzet_21_plus', 'bv. 8010')}
					{field('BTW af te dragen 21%', 'account_btw_21', 'bv. 1500')}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>SEPA-incasso</CardTitle>
					<CardDescription>Gegevens van uw incassant; gebruikt voor pain.008 XML-bestanden.</CardDescription>
				</CardHeader>
				<CardContent className="grid gap-4 sm:grid-cols-2">
					{field('Naam crediteur', 'sepa_creditor_name', 'Popschool Harderwijk')}
					{field('Crediteur-ID (SEPA)', 'sepa_creditor_id', 'NL00ZZZ123456780000')}
					{field('IBAN crediteur', 'sepa_creditor_iban', 'NL00BANK0123456789')}
					{field('BIC crediteur', 'sepa_creditor_bic', 'BANKNL2A')}
					<div className="space-y-1.5">
						<Label htmlFor="acc-coll-day">Incassodag van de maand</Label>
						<Input
							id="acc-coll-day"
							type="number"
							min={1}
							max={28}
							disabled={!canEdit}
							value={form.sepa_collection_day}
							onChange={(e) =>
								update('sepa_collection_day', Math.min(28, Math.max(1, Number(e.target.value) || 27)))
							}
						/>
					</div>
					{field('Mandaat-prefix', 'sepa_mandate_prefix', 'MND')}
					{field('Omschrijving-template', 'sepa_remittance_template', 'Lesgeld {periode} - {leerling}')}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>BTW-codes & overig</CardTitle>
				</CardHeader>
				<CardContent className="grid gap-4 sm:grid-cols-2">
					{field('BTW-code 21%', 'btw_code_21', 'bv. VH')}
					{field('BTW-code vrijgesteld', 'btw_code_exempt', 'bv. 0')}
					{field('Valuta', 'currency', 'EUR')}
					<div className="space-y-1.5">
						<Label htmlFor="acc-month">Boekjaar startmaand</Label>
						<Input
							id="acc-month"
							type="number"
							min={1}
							max={12}
							disabled={!canEdit}
							value={form.school_year_start_month}
							onChange={(e) =>
								update(
									'school_year_start_month',
									Math.min(12, Math.max(1, Number(e.target.value) || 1)),
								)
							}
						/>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Bedrijfsgegevens & factuur</CardTitle>
					<CardDescription>Verschijnen op alle facturen (PDF + e-mail).</CardDescription>
				</CardHeader>
				<CardContent className="grid gap-4 sm:grid-cols-2">
					{field('Bedrijfsnaam', 'company_name', 'popschool harderwijk')}
					{field('E-mailadres', 'company_email', 'info@popschoolharderwijk.nl')}
					{field('Telefoon', 'company_phone', '0341 - 123456')}
					{field('Adres', 'company_address', 'Hoofdstraat 1')}
					{field('Postcode', 'company_postcode', '3841 AB')}
					{field('Plaats', 'company_city', 'Harderwijk')}
					{field('KvK-nummer', 'company_kvk', '12345678')}
					{field('BTW-nummer', 'company_btw_nummer', 'NL123456789B01')}
					{field('IBAN', 'company_iban', 'NL00BANK0123456789')}
					{field('Logo-URL (optioneel)', 'company_logo_url')}
					{field('Factuurnummer-prefix', 'invoice_number_prefix', 'INV-')}
					<div className="space-y-1.5">
						<Label htmlFor="acc-pay-term">Betaaltermijn (dagen)</Label>
						<Input
							id="acc-pay-term"
							type="number"
							min={1}
							max={90}
							disabled={!canEdit}
							value={form.invoice_payment_term_days}
							onChange={(e) =>
								update(
									'invoice_payment_term_days',
									Math.min(90, Math.max(1, Number(e.target.value) || 14)),
								)
							}
						/>
					</div>
					<div className="space-y-1.5 sm:col-span-2">
						<Label htmlFor="acc-footer">Footer-tekst (optioneel)</Label>
						<Input
							id="acc-footer"
							value={form.invoice_footer_text ?? ''}
							disabled={!canEdit}
							onChange={(e) => update('invoice_footer_text', e.target.value)}
							placeholder="bv. Bedankt voor je aanmelding bij popschool harderwijk!"
						/>
					</div>
				</CardContent>
			</Card>

			{canEdit && (
				<div className="flex justify-end">
					<Button onClick={handleSave} disabled={saving}>
						<LuSave className="h-4 w-4 mr-2" />
						{saving ? 'Opslaan...' : 'Opslaan'}
					</Button>
				</div>
			)}
		</div>
	);
}
