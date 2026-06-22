import { useCallback, useEffect, useState } from 'react';
import { LuDownload, LuFileText, LuMail } from 'react-icons/lu';
import { toast } from 'sonner';
import { AdminSiteGuard } from '@/components/auth/AdminSiteGuard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { supabase } from '@/integrations/supabase/client';
import { formatCentsEUR, INVOICE_STATUS_LABELS, type Invoice } from '@/lib/invoices/types';

interface Row extends Invoice {
	profiles?: { first_name: string | null; last_name: string | null; email: string } | null;
}

export default function Invoices() {
	return (
		<AdminSiteGuard>
			<List />
		</AdminSiteGuard>
	);
}

function List() {
	const [rows, setRows] = useState<Row[]>([]);
	const [loading, setLoading] = useState(true);
	const [downloading, setDownloading] = useState<string | null>(null);
	const [search, setSearch] = useState('');

	const load = useCallback(async () => {
		setLoading(true);
		const { data, error } = await supabase
			.from('invoices')
			.select('*, profiles!invoices_student_user_id_fkey(first_name,last_name,email)')
			.order('issue_date', { ascending: false })
			.limit(500);
		if (error) toast.error(error.message);
		setRows((data ?? []) as unknown as Row[]);
		setLoading(false);
	}, []);

	useEffect(() => {
		load();
	}, [load]);

	const handleDownload = async (id: string) => {
		setDownloading(id);
		const { data, error } = await supabase.functions.invoke('get-invoice-pdf', { body: { invoice_id: id } });
		setDownloading(null);
		if (error) {
			toast.error(error.message);
			return;
		}
		const url = (data as { signed_url?: string } | null)?.signed_url;
		if (url) window.open(url, '_blank');
	};

	const filtered = rows.filter((r) => {
		if (!search) return true;
		const q = search.toLowerCase();
		const name = `${r.profiles?.first_name ?? ''} ${r.profiles?.last_name ?? ''}`.toLowerCase();
		return (
			r.invoice_number.toLowerCase().includes(q) ||
			name.includes(q) ||
			(r.profiles?.email ?? '').toLowerCase().includes(q)
		);
	});

	return (
		<div className="space-y-6">
			<PageHeader
				title="Facturen"
				subtitle="Alle uitgegeven facturen"
				icon={<LuFileText className="h-16 w-16 text-primary" />}
			/>

			<div className="max-w-sm">
				<Input
					placeholder="Zoek op factuurnummer of leerling..."
					value={search}
					onChange={(e) => setSearch(e.target.value)}
				/>
			</div>

			{loading ? (
				<Card>
					<CardContent className="py-8 text-center text-muted-foreground">Laden...</CardContent>
				</Card>
			) : filtered.length === 0 ? (
				<Card>
					<CardContent className="py-12 text-center text-muted-foreground">Nog geen facturen.</CardContent>
				</Card>
			) : (
				<Card>
					<CardContent className="p-0">
						<table className="w-full text-sm">
							<thead className="bg-muted/50 text-left">
								<tr>
									<th className="p-3">Factuurnr.</th>
									<th className="p-3">Leerling</th>
									<th className="p-3">Datum</th>
									<th className="p-3">Status</th>
									<th className="p-3">Verstuurd</th>
									<th className="p-3 text-right">Bedrag</th>
									<th className="p-3" />
								</tr>
							</thead>
							<tbody>
								{filtered.map((inv) => (
									<tr key={inv.id} className="border-t">
										<td className="p-3 font-medium">{inv.invoice_number}</td>
										<td className="p-3">
											{inv.profiles
												? `${inv.profiles.first_name ?? ''} ${inv.profiles.last_name ?? ''}`.trim() ||
													inv.profiles.email
												: '—'}
										</td>
										<td className="p-3">{inv.issue_date}</td>
										<td className="p-3">
											<Badge variant="secondary">{INVOICE_STATUS_LABELS[inv.status]}</Badge>
										</td>
										<td className="p-3">
											{inv.sent_at ? (
												<LuMail className="h-4 w-4 text-primary" />
											) : (
												<span className="text-muted-foreground">—</span>
											)}
										</td>
										<td className="p-3 text-right">{formatCentsEUR(inv.amount_total_cents)}</td>
										<td className="p-3 text-right">
											<Button
												size="sm"
												variant="outline"
												disabled={!inv.pdf_storage_path || downloading === inv.id}
												onClick={() => handleDownload(inv.id)}
											>
												<LuDownload className="h-4 w-4 mr-1" /> PDF
											</Button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
