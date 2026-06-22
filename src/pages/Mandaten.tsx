import { useCallback, useEffect, useState } from 'react';
import { LuPlus, LuTrash2 } from 'react-icons/lu';
import { toast } from 'sonner';
import { AdminSiteGuard } from '@/components/auth/AdminSiteGuard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/ui/page-header';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserSelectSingle } from '@/components/ui/user-select';
import { NAV_LABELS } from '@/config/nav-labels';
import { supabase } from '@/integrations/supabase/client';
import { isValidIban, normalizeIban } from '@/lib/incasso/iban';
import { MANDATE_STATUS_LABELS, type SepaMandate } from '@/lib/incasso/types';

interface MandateRow extends SepaMandate {
	profiles: { first_name: string | null; last_name: string | null; email: string } | null;
}

export default function Mandaten() {
	return (
		<AdminSiteGuard>
			<MandatenContent />
		</AdminSiteGuard>
	);
}

function MandatenContent() {
	const [rows, setRows] = useState<MandateRow[]>([]);
	const [loading, setLoading] = useState(true);
	const [dialogOpen, setDialogOpen] = useState(false);

	const load = useCallback(async () => {
		setLoading(true);
		const { data, error } = await supabase
			.from('sepa_mandates')
			.select('*, profiles!sepa_mandates_student_user_id_fkey(first_name,last_name,email)')
			.order('created_at', { ascending: false });
		if (error) toast.error(error.message);
		setRows((data ?? []) as unknown as MandateRow[]);
		setLoading(false);
	}, []);

	useEffect(() => {
		load();
	}, [load]);

	const handleDelete = async (id: string) => {
		if (!confirm('Mandaat verwijderen?')) return;
		const { error } = await supabase.from('sepa_mandates').delete().eq('id', id);
		if (error) {
			toast.error(error.message);
			return;
		}
		toast.success('Verwijderd');
		load();
	};




	return (
		<div className="space-y-6">
			<PageHeader
				title={NAV_LABELS.mandaten}
				subtitle="SEPA-incassomandaten van leerlingen"
				actions={
					<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
						<DialogTrigger asChild>
							<Button>
								<LuPlus className="h-4 w-4 mr-2" /> Nieuw mandaat
							</Button>
						</DialogTrigger>
						<NewMandateDialog
							onClose={() => setDialogOpen(false)}
							onCreated={() => {
								setDialogOpen(false);
								load();
							}}
						/>
					</Dialog>
				}
			/>

			<Card>
				<CardContent className="p-0">
					{loading ? (
						<div className="p-8 text-center text-muted-foreground">Laden...</div>
					) : rows.length === 0 ? (
						<div className="p-8 text-center text-muted-foreground">Nog geen mandaten</div>
					) : (
						<table className="w-full text-sm">
							<thead className="bg-muted/50 text-left">
								<tr>
									<th className="p-3">Kenmerk</th>
									<th className="p-3">Leerling</th>
									<th className="p-3">IBAN</th>
									<th className="p-3">Rekeninghouder</th>
									<th className="p-3">Status</th>
									<th className="p-3">Volgorde</th>
									<th className="p-3 text-right">Acties</th>
								</tr>
							</thead>
							<tbody>
								{rows.map((m) => (
									<tr key={m.id} className="border-t">
										<td className="p-3 font-mono text-xs">{m.mandate_reference}</td>
										<td className="p-3">
											{m.profiles
												? `${m.profiles.first_name ?? ''} ${m.profiles.last_name ?? ''}`.trim() ||
													m.profiles.email
												: '—'}
										</td>
										<td className="p-3 font-mono text-xs">{m.iban}</td>
										<td className="p-3">{m.account_holder}</td>
										<td className="p-3">
											<Badge
												variant={
													m.status === 'active'
														? 'default'
														: m.status === 'revoked'
															? 'destructive'
															: 'secondary'
												}
											>
												{MANDATE_STATUS_LABELS[m.status]}
											</Badge>
										</td>
										<td className="p-3">{m.sequence_type}</td>
										<td className="p-3 text-right space-x-2">
											<Button size="sm" variant="ghost" onClick={() => handleDelete(m.id)}>
												<LuTrash2 className="h-4 w-4" />
											</Button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					)}
				</CardContent>
			</Card>
		</div>
	);
}

function NewMandateDialog({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
	const [studentId, setStudentId] = useState<string | null>(null);
	const [iban, setIban] = useState('');
	const [bic, setBic] = useState('');
	const [holder, setHolder] = useState('');
	const [signedAt, setSignedAt] = useState(new Date().toISOString().slice(0, 10));
	const [method, setMethod] = useState<'digital' | 'paper'>('paper');
	const [saving, setSaving] = useState(false);

	const handleSubmit = async () => {
		if (!studentId || !iban || !holder) {
			toast.error('Vul leerling, IBAN en rekeninghouder in');
			return;
		}
		const normalizedIban = normalizeIban(iban);
		if (!isValidIban(normalizedIban)) {
			toast.error('Ongeldig IBAN');
			return;
		}
		setSaving(true);
		const { data: refData, error: refErr } = await supabase.rpc('next_mandate_reference');
		if (refErr || !refData) {
			setSaving(false);
			toast.error(`Kenmerk genereren mislukt: ${refErr?.message ?? 'onbekend'}`);
			return;
		}
		const { error } = await supabase.from('sepa_mandates').insert({
			student_user_id: studentId,
			mandate_reference: refData as string,
			iban: normalizedIban,
			bic: bic || null,
			account_holder: holder,
			signed_at: signedAt,
			signature_method: method,
			status: 'active',
			sequence_type: 'FRST',
		});
		setSaving(false);
		if (error) {
			toast.error(error.message);
			return;
		}
		toast.success('Mandaat aangemaakt');
		onCreated();
	};

	return (
		<DialogContent>
			<DialogHeader>
				<DialogTitle>Nieuw SEPA-mandaat</DialogTitle>
				<DialogDescription>Het mandaatkenmerk wordt automatisch gegenereerd.</DialogDescription>
			</DialogHeader>
			<div className="space-y-3">
				<div className="space-y-1.5">
					<Label>Leerling</Label>
					<UserSelectSingle
						value={studentId}
						onChange={(u) => {
							setStudentId(u?.user_id ?? null);
							if (u && !holder) {
								const name = [u.first_name, u.last_name].filter(Boolean).join(' ').trim();
								if (name) setHolder(name);
							}
						}}
						filter="students"
						placeholder="Kies leerling..."
					/>
				</div>
				<div className="space-y-1.5">
					<Label>IBAN</Label>
					<Input value={iban} onChange={(e) => setIban(e.target.value)} placeholder="NL00BANK0123456789" />
				</div>
				<div className="space-y-1.5">
					<Label>BIC (optioneel)</Label>
					<Input value={bic} onChange={(e) => setBic(e.target.value)} placeholder="BANKNL2A" />
				</div>
				<div className="space-y-1.5">
					<Label>Rekeninghouder</Label>
					<Input value={holder} onChange={(e) => setHolder(e.target.value)} />
				</div>
				<div className="grid grid-cols-2 gap-3">
					<div className="space-y-1.5">
						<Label>Ondertekend op</Label>
						<Input type="date" value={signedAt} onChange={(e) => setSignedAt(e.target.value)} />
					</div>
					<div className="space-y-1.5">
						<Label>Wijze</Label>
						<Select value={method} onValueChange={(v) => setMethod(v as 'digital' | 'paper')}>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="paper">Papier</SelectItem>
								<SelectItem value="digital">Digitaal</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>
			</div>
			<DialogFooter>
				<Button variant="outline" onClick={onClose}>
					Annuleren
				</Button>
				<Button onClick={handleSubmit} disabled={saving}>
					{saving ? 'Opslaan...' : 'Aanmaken'}
				</Button>
			</DialogFooter>
		</DialogContent>
	);
}
