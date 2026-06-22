import { useCallback, useEffect, useState } from 'react';
import { LuArrowLeft, LuDownload, LuFileCog, LuRefreshCw } from 'react-icons/lu';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { AdminSiteGuard } from '@/components/auth/AdminSiteGuard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import {
	BATCH_STATUS_LABELS,
	type BatchItemStatus,
	type IncassoBatch,
	type IncassoBatchItem,
	ITEM_STATUS_LABELS,
	formatCentsEUR,
} from '@/lib/incasso/types';

interface ItemRow extends IncassoBatchItem {
	profiles: { first_name: string | null; last_name: string | null; email: string } | null;
}

export default function IncassoBatchDetail() {
	return (
		<AdminSiteGuard>
			<Detail />
		</AdminSiteGuard>
	);
}

function Detail() {
	const { id } = useParams<{ id: string }>();
	const [batch, setBatch] = useState<IncassoBatch | null>(null);
	const [items, setItems] = useState<ItemRow[]>([]);
	const [loading, setLoading] = useState(true);
	const [busy, setBusy] = useState(false);

	const load = useCallback(async () => {
		if (!id) return;
		setLoading(true);
		const [{ data: b }, { data: it }] = await Promise.all([
			supabase.from('incasso_batches').select('*').eq('id', id).maybeSingle(),
			supabase
				.from('incasso_batch_items')
				.select('*, profiles!incasso_batch_items_student_user_id_fkey(first_name,last_name,email)')
				.eq('batch_id', id)
				.order('created_at'),
		]);
		setBatch((b as unknown as IncassoBatch) ?? null);
		setItems((it ?? []) as unknown as ItemRow[]);
		setLoading(false);
	}, [id]);

	useEffect(() => {
		load();
	}, [load]);

	const handleBuild = async () => {
		if (!id) return;
		setBusy(true);
		const { data, error } = await supabase.rpc('build_incasso_batch_items', { p_batch_id: id });
		setBusy(false);
		if (error) {
			toast.error(error.message);
			return;
		}
		toast.success(`${data ?? 0} regels toegevoegd`);
		load();
	};

	const handleApprove = async () => {
		if (!id) return;
		setBusy(true);
		const { error } = await supabase
			.from('incasso_batches')
			.update({ status: 'approved', approved_at: new Date().toISOString() })
			.eq('id', id);
		if (error) {
			setBusy(false);
			toast.error(error.message);
			return;
		}
		// Genereer facturen + verstuur per e-mail
		toast.info('Facturen worden aangemaakt en gemaild...');
		const { data: invResp, error: invErr } = await supabase.functions.invoke('generate-invoice', {
			body: { batch_id: id, send_email: true },
		});
		setBusy(false);
		if (invErr) {
			toast.error(`Factuurgeneratie faalde: ${invErr.message}`);
		} else {
			const results = (invResp as { results?: Array<{ invoice_number?: string; error?: string }> } | null)?.results ?? [];
			const ok = results.filter((r) => r.invoice_number && !r.error).length;
			const failed = results.filter((r) => r.error).length;
			toast.success(`Batch goedgekeurd — ${ok} factuur/facturen aangemaakt${failed > 0 ? `, ${failed} fout` : ''}.`);
		}
		load();
	};

	const handleGenerateXml = async () => {
		if (!id) return;
		setBusy(true);
		const { data, error } = await supabase.functions.invoke('generate-sepa-xml', {
			body: { batch_id: id },
		});
		setBusy(false);
		if (error) {
			toast.error(error.message);
			return;
		}
		toast.success('XML gegenereerd');
		// Mark active mandates as used + items submitted
		await supabase
			.from('incasso_batches')
			.update({ status: 'submitted', submitted_at: new Date().toISOString() })
			.eq('id', id);
		await supabase
			.from('incasso_batch_items')
			.update({ status: 'submitted', status_updated_at: new Date().toISOString() })
			.eq('batch_id', id)
			.eq('status', 'pending');
		load();
		const path = (data as { storage_path?: string } | null)?.storage_path;
		if (path) await downloadXml(path);
	};

	const downloadXml = async (path: string) => {
		const { data, error } = await supabase.storage.from('sepa-batches').createSignedUrl(path, 60);
		if (error || !data?.signedUrl) {
			toast.error(error?.message ?? 'Geen URL');
			return;
		}
		window.open(data.signedUrl, '_blank');
	};

	const handleUpdateItemStatus = async (itemId: string, status: BatchItemStatus) => {
		const { error } = await supabase
			.from('incasso_batch_items')
			.update({ status, status_updated_at: new Date().toISOString() })
			.eq('id', itemId);
		if (error) {
			toast.error(error.message);
			return;
		}
		load();
	};

	const handleClose = async () => {
		if (!id) return;
		const { error } = await supabase
			.from('incasso_batches')
			.update({ status: 'closed', closed_at: new Date().toISOString() })
			.eq('id', id);
		if (error) {
			toast.error(error.message);
			return;
		}
		toast.success('Batch afgerond');
		load();
	};

	if (loading) return <div className="p-8 text-center text-muted-foreground">Laden...</div>;
	if (!batch) return <div className="p-8 text-center text-muted-foreground">Batch niet gevonden</div>;

	const isDraft = batch.status === 'draft';
	const isApproved = batch.status === 'approved';
	const isSubmitted = batch.status === 'submitted';

	return (
		<div className="space-y-6">
			<PageHeader
				title={`Batch ${batch.batch_number}`}
				subtitle={`Incassodatum ${batch.collection_date} — ${BATCH_STATUS_LABELS[batch.status]}`}
				actions={
					<Link to="/incasso">
						<Button variant="ghost" size="sm">
							<LuArrowLeft className="h-4 w-4 mr-2" /> Terug
						</Button>
					</Link>
				}
			/>

			<Card>
				<CardHeader>
					<CardTitle>Overzicht</CardTitle>
				</CardHeader>
				<CardContent className="grid gap-4 sm:grid-cols-4">
					<Stat label="Status" value={BATCH_STATUS_LABELS[batch.status]} />
					<Stat label="Regels" value={String(batch.item_count)} />
					<Stat label="Totaal" value={formatCentsEUR(batch.total_amount_cents)} />
					<Stat label="Incassodatum" value={batch.collection_date} />
				</CardContent>
			</Card>

			<div className="flex flex-wrap gap-2">
				{isDraft && (
					<>
						<Button onClick={handleBuild} disabled={busy}>
							<LuRefreshCw className="h-4 w-4 mr-2" /> Vul concept
						</Button>
						<Button variant="outline" onClick={handleApprove} disabled={busy || batch.item_count === 0}>
							Goedkeuren
						</Button>
					</>
				)}
				{isApproved && (
					<Button onClick={handleGenerateXml} disabled={busy}>
						<LuFileCog className="h-4 w-4 mr-2" /> Genereer XML & aanbieden
					</Button>
				)}
				{batch.xml_storage_path && (
					<Button variant="outline" onClick={() => downloadXml(batch.xml_storage_path as string)}>
						<LuDownload className="h-4 w-4 mr-2" /> Download XML
					</Button>
				)}
				{isSubmitted && (
					<Button variant="outline" onClick={handleClose}>
						Markeer als afgerond
					</Button>
				)}
			</div>

			<Card>
				<CardContent className="p-0">
					{items.length === 0 ? (
						<div className="p-8 text-center text-muted-foreground">
							Nog geen regels. Klik "Vul concept" om actieve SEPA-overeenkomsten in te lezen.
						</div>
					) : (
						<table className="w-full text-sm">
							<thead className="bg-muted/50 text-left">
								<tr>
									<th className="p-3">Leerling</th>
									<th className="p-3">Omschrijving</th>
									<th className="p-3">Type</th>
									<th className="p-3 text-right">Bedrag</th>
									<th className="p-3">Status</th>
								</tr>
							</thead>
							<tbody>
								{items.map((it) => (
									<tr key={it.id} className="border-t">
										<td className="p-3">
											{it.profiles
												? `${it.profiles.first_name ?? ''} ${it.profiles.last_name ?? ''}`.trim() ||
													it.profiles.email
												: '—'}
										</td>
										<td className="p-3">{it.remittance_info}</td>
										<td className="p-3">
											<Badge variant="outline">{it.sequence_type}</Badge>
										</td>
										<td className="p-3 text-right">{formatCentsEUR(it.amount_cents)}</td>
										<td className="p-3">
											{batch.status === 'submitted' || batch.status === 'closed' ? (
												<Select
													value={it.status}
													onValueChange={(v) => handleUpdateItemStatus(it.id, v as BatchItemStatus)}
												>
													<SelectTrigger className="h-8 w-36">
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														{(Object.keys(ITEM_STATUS_LABELS) as BatchItemStatus[]).map((s) => (
															<SelectItem key={s} value={s}>
																{ITEM_STATUS_LABELS[s]}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											) : (
												<Badge variant="secondary">{ITEM_STATUS_LABELS[it.status]}</Badge>
											)}
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

function Stat({ label, value }: { label: string; value: string }) {
	return (
		<div>
			<div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
			<div className="text-lg font-semibold">{value}</div>
		</div>
	);
}
