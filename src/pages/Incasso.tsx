import { useCallback, useEffect, useState } from 'react';
import { LuPlus } from 'react-icons/lu';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { AdminSiteGuard } from '@/components/auth/AdminSiteGuard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/ui/page-header';
import { NAV_LABELS } from '@/config/nav-labels';
import { useAccountingSettings } from '@/hooks/useAccounting';
import { supabase } from '@/integrations/supabase/client';
import { BATCH_STATUS_LABELS, type IncassoBatch, formatCentsEUR } from '@/lib/incasso/types';

export default function Incasso() {
	return (
		<AdminSiteGuard>
			<IncassoContent />
		</AdminSiteGuard>
	);
}

function IncassoContent() {
	const [rows, setRows] = useState<IncassoBatch[]>([]);
	const [loading, setLoading] = useState(true);
	const [dialogOpen, setDialogOpen] = useState(false);
	const { settings } = useAccountingSettings();

	const load = useCallback(async () => {
		setLoading(true);
		const { data, error } = await supabase
			.from('incasso_batches')
			.select('*')
			.order('collection_date', { ascending: false });
		if (error) toast.error(error.message);
		setRows((data ?? []) as unknown as IncassoBatch[]);
		setLoading(false);
	}, []);

	useEffect(() => {
		load();
	}, [load]);

	return (
		<div className="space-y-6">
			<PageHeader
				title={NAV_LABELS.incasso}
				subtitle="Maandelijkse SEPA-incasso batches"
				actions={
					<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
						<DialogTrigger asChild>
							<Button>
								<LuPlus className="h-4 w-4 mr-2" /> Nieuwe batch
							</Button>
						</DialogTrigger>
						<NewBatchDialog
							defaultCollectionDay={settings?.sepa_collection_day ?? 27}
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
						<div className="p-8 text-center text-muted-foreground">Nog geen batches</div>
					) : (
						<table className="w-full text-sm">
							<thead className="bg-muted/50 text-left">
								<tr>
									<th className="p-3">Nummer</th>
									<th className="p-3">Incassodatum</th>
									<th className="p-3">Status</th>
									<th className="p-3 text-right">Regels</th>
									<th className="p-3 text-right">Totaal</th>
									<th className="p-3" />
								</tr>
							</thead>
							<tbody>
								{rows.map((b) => (
									<tr key={b.id} className="border-t">
										<td className="p-3 font-mono">{b.batch_number}</td>
										<td className="p-3">{b.collection_date}</td>
										<td className="p-3">
											<Badge variant={b.status === 'draft' ? 'secondary' : 'default'}>
												{BATCH_STATUS_LABELS[b.status]}
											</Badge>
										</td>
										<td className="p-3 text-right">{b.item_count}</td>
										<td className="p-3 text-right">{formatCentsEUR(b.total_amount_cents)}</td>
										<td className="p-3 text-right">
											<Link to={`/incasso/batches/${b.id}`}>
												<Button size="sm" variant="outline">
													Openen
												</Button>
											</Link>
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

function NewBatchDialog({
	defaultCollectionDay,
	onClose,
	onCreated,
}: {
	defaultCollectionDay: number;
	onClose: () => void;
	onCreated: () => void;
}) {
	const computeDefault = () => {
		const d = new Date();
		const year = d.getFullYear();
		const month = d.getMonth() + 1;
		return `${year}-${String(month).padStart(2, '0')}-${String(defaultCollectionDay).padStart(2, '0')}`;
	};
	const [collectionDate, setCollectionDate] = useState(computeDefault());
	const [saving, setSaving] = useState(false);

	const handleSubmit = async () => {
		setSaving(true);
		const yyyymm = collectionDate.slice(0, 7).replace('-', '');
		const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
		const batch_number = `INC-${yyyymm}-${suffix}`;
		const { error } = await supabase.from('incasso_batches').insert({
			batch_number,
			collection_date: collectionDate,
			status: 'draft',
		});
		setSaving(false);
		if (error) {
			toast.error(error.message);
			return;
		}
		toast.success('Batch aangemaakt');
		onCreated();
	};

	return (
		<DialogContent>
			<DialogHeader>
				<DialogTitle>Nieuwe incassobatch</DialogTitle>
			</DialogHeader>
			<div className="space-y-3">
				<div className="space-y-1.5">
					<Label>Incassodatum</Label>
					<Input type="date" value={collectionDate} onChange={(e) => setCollectionDate(e.target.value)} />
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
