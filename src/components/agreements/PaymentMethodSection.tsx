import { useEffect, useState } from 'react';
import { LuCreditCard, LuSignature, LuWallet } from 'react-icons/lu';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';

export type PaymentMethod = 'stripe' | 'sepa' | 'manual';

interface MandateOption {
	id: string;
	mandate_reference: string;
	iban: string;
	account_holder: string;
	status: string;
}

interface Props {
	paymentMethod: PaymentMethod;
	sepaMandateId: string | null;
	studentUserId: string | null;
	onPaymentMethodChange: (value: PaymentMethod) => void;
	onSepaMandateIdChange: (value: string | null) => void;
}

export function PaymentMethodSection({
	paymentMethod,
	sepaMandateId,
	studentUserId,
	onPaymentMethodChange,
	onSepaMandateIdChange,
}: Props) {
	const [mandates, setMandates] = useState<MandateOption[]>([]);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (paymentMethod !== 'sepa' || !studentUserId) {
			setMandates([]);
			return;
		}
		setLoading(true);
		void supabase
			.from('sepa_mandates')
			.select('id, mandate_reference, iban, account_holder, status')
			.eq('student_user_id', studentUserId)
			.in('status', ['active', 'pending'])
			.order('created_at', { ascending: false })
			.then(({ data }) => {
				setMandates(data ?? []);
				setLoading(false);
				if (data && data.length === 1 && !sepaMandateId) {
					onSepaMandateIdChange(data[0].id);
				}
			});
	}, [paymentMethod, studentUserId, sepaMandateId, onSepaMandateIdChange]);

	const maskIban = (iban: string) => (iban.length > 8 ? `${iban.slice(0, 4)} •••• ${iban.slice(-4)}` : iban);

	return (
		<div className="rounded-lg border bg-muted/30 p-4 space-y-4">
			<div>
				<h4 className="font-medium mb-1">Betaalmethode</h4>
				<p className="text-sm text-muted-foreground">Kies hoe de leerling deze overeenkomst betaalt.</p>
			</div>

			<RadioGroup
				value={paymentMethod}
				onValueChange={(v) => {
					onPaymentMethodChange(v as PaymentMethod);
					if (v !== 'sepa') onSepaMandateIdChange(null);
				}}
				className="grid gap-2"
			>
				<label
					htmlFor="pm-stripe"
					className="flex items-start gap-3 rounded-md border bg-background p-3 cursor-pointer hover:bg-accent/40"
				>
					<RadioGroupItem value="stripe" id="pm-stripe" className="mt-1" />
					<div className="flex-1">
						<div className="flex items-center gap-2 font-medium">
							<LuCreditCard className="h-4 w-4" /> Stripe (iDEAL / kaart)
						</div>
						<p className="text-xs text-muted-foreground">
							Leerling betaalt via Stripe-abonnement na uitnodiging.
						</p>
					</div>
				</label>

				<label
					htmlFor="pm-sepa"
					className="flex items-start gap-3 rounded-md border bg-background p-3 cursor-pointer hover:bg-accent/40"
				>
					<RadioGroupItem value="sepa" id="pm-sepa" className="mt-1" />
					<div className="flex-1">
						<div className="flex items-center gap-2 font-medium">
							<LuSignature className="h-4 w-4" /> SEPA-incasso
						</div>
						<p className="text-xs text-muted-foreground">
							Maandelijks automatisch incasseren via een SEPA-mandaat.
						</p>
					</div>
				</label>

				<label
					htmlFor="pm-manual"
					className="flex items-start gap-3 rounded-md border bg-background p-3 cursor-pointer hover:bg-accent/40"
				>
					<RadioGroupItem value="manual" id="pm-manual" className="mt-1" />
					<div className="flex-1">
						<div className="flex items-center gap-2 font-medium">
							<LuWallet className="h-4 w-4" /> Handmatig / op factuur
						</div>
						<p className="text-xs text-muted-foreground">Geen automatische betaling; je factureert zelf.</p>
					</div>
				</label>
			</RadioGroup>

			{paymentMethod === 'sepa' && (
				<div className="space-y-2">
					<Label htmlFor="sepa-mandate">SEPA-mandaat</Label>
					{loading ? (
						<p className="text-sm text-muted-foreground">Mandaten laden…</p>
					) : mandates.length === 0 ? (
						<p className="text-sm text-amber-600">
							Geen actief mandaat gevonden voor deze leerling. Maak eerst een mandaat aan via{' '}
							<a href="/mandaten" className="underline">
								Mandaten
							</a>
							.
						</p>
					) : (
						<Select value={sepaMandateId ?? ''} onValueChange={(v) => onSepaMandateIdChange(v || null)}>
							<SelectTrigger id="sepa-mandate">
								<SelectValue placeholder="Kies een mandaat" />
							</SelectTrigger>
							<SelectContent>
								{mandates.map((m) => (
									<SelectItem key={m.id} value={m.id}>
										{m.mandate_reference} — {m.account_holder} ({maskIban(m.iban)})
										{m.status === 'pending' ? ' • in afwachting' : ''}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					)}
				</div>
			)}
		</div>
	);
}
