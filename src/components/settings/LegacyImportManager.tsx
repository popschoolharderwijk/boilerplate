import { useState } from 'react';
import { LuDownload, LuFileSpreadsheet, LuTriangleAlert, LuUpload } from 'react-icons/lu';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';

type Tab = 'lesson_types' | 'lesson_type_options' | 'teachers' | 'students' | 'lesson_agreements';

interface RowError {
	tab: Tab;
	row: number;
	field?: string;
	message: string;
}
interface ImportSummary {
	tab: Tab;
	created: number;
	updated: number;
	failed: number;
}
interface ValidationResponse {
	ok: boolean;
	errors: RowError[];
	counts: Record<Tab, number>;
}
interface ImportResponse {
	ok: boolean;
	summaries: ImportSummary[];
	errors: RowError[];
	counts: Record<Tab, number>;
}

function fileToBase64(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			const result = reader.result as string;
			resolve(result.split(',')[1] ?? '');
		};
		reader.onerror = () => reject(reader.error);
		reader.readAsDataURL(file);
	});
}

function errorsToCsv(errors: RowError[]): string {
	const header = 'tab,row,field,message\n';
	const csvEscape = (v: string) => `"${v.replace(/"/g, '""')}"`;
	return (
		header +
		errors.map((e) => [e.tab, e.row, e.field ?? '', e.message].map((v) => csvEscape(String(v))).join(',')).join('\n')
	);

}

export function LegacyImportManager() {
	const [file, setFile] = useState<File | null>(null);
	const [busy, setBusy] = useState(false);
	const [validation, setValidation] = useState<ValidationResponse | null>(null);
	const [importResult, setImportResult] = useState<ImportResponse | null>(null);
	const [confirmOpen, setConfirmOpen] = useState(false);

	async function downloadTemplate() {
		setBusy(true);
		try {
			const { data, error } = await supabase.functions.invoke('import-legacy-data', {
				body: { action: 'template' },
			});
			if (error) throw error;
			const blob = data instanceof Blob ? data : new Blob([data as ArrayBuffer]);
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = 'legacy-import-template.xlsx';
			a.click();
			URL.revokeObjectURL(url);
		} catch (err) {
			toast.error('Kon template niet downloaden', {
				description: err instanceof Error ? err.message : 'Onbekende fout',
			});
		} finally {
			setBusy(false);
		}
	}

	async function validate() {
		if (!file) return;
		setBusy(true);
		setValidation(null);
		setImportResult(null);
		try {
			const file_base64 = await fileToBase64(file);
			const { data, error } = await supabase.functions.invoke<ValidationResponse>('import-legacy-data', {
				body: { action: 'validate', file_base64 },
			});
			if (error) throw error;
			setValidation(data ?? null);
			if (data?.ok) toast.success('Validatie geslaagd — klaar om te importeren');
			else toast.warning(`Validatie meldt ${data?.errors.length ?? 0} fout(en)`);
		} catch (err) {
			toast.error('Validatie mislukt', { description: err instanceof Error ? err.message : 'Onbekend' });
		} finally {
			setBusy(false);
		}
	}

	async function runImport() {
		if (!file) return;
		setBusy(true);
		setImportResult(null);
		try {
			const file_base64 = await fileToBase64(file);
			const { data, error } = await supabase.functions.invoke<ImportResponse>('import-legacy-data', {
				body: { action: 'import', file_base64 },
			});
			if (error) throw error;
			setImportResult(data ?? null);
			if (data?.ok) toast.success('Import voltooid');
			else toast.warning(`Import voltooid met ${data?.errors.length ?? 0} fout(en)`);
		} catch (err) {
			toast.error('Import mislukt', { description: err instanceof Error ? err.message : 'Onbekend' });
		} finally {
			setBusy(false);
			setConfirmOpen(false);
		}
	}

	function downloadErrors(errors: RowError[], name: string) {
		const blob = new Blob([errorsToCsv(errors)], { type: 'text/csv' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = name;
		a.click();
		URL.revokeObjectURL(url);
	}

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<LuFileSpreadsheet className="h-5 w-5" />
						Data importeren uit oud systeem
					</CardTitle>
					<CardDescription>
						Importeer lestypes, docenten, leerlingen en actieve overeenkomsten via een Excel-bestand. De
						import is idempotent: je kunt hetzelfde bestand opnieuw uploaden zonder duplicaten.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					<div className="flex flex-wrap gap-2">
						<Button type="button" variant="outline" onClick={downloadTemplate} disabled={busy}>
							<LuDownload className="mr-2 h-4 w-4" />
							Download template
						</Button>
					</div>

					<div className="space-y-2">
						<Label htmlFor="legacy-file">Excel-bestand (.xlsx)</Label>
						<Input
							id="legacy-file"
							type="file"
							accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
							onChange={(e) => {
								setFile(e.target.files?.[0] ?? null);
								setValidation(null);
								setImportResult(null);
							}}
							disabled={busy}
						/>
					</div>

					<div className="flex flex-wrap gap-2">
						<Button type="button" onClick={validate} disabled={!file || busy}>
							<LuUpload className="mr-2 h-4 w-4" />
							Valideren
						</Button>
						<Button
							type="button"
							variant="default"
							onClick={() => setConfirmOpen(true)}
							disabled={!file || busy || !validation?.ok}
						>
							Importeren
						</Button>
					</div>

					{validation && (
						<div className="space-y-2 rounded-md border p-4">
							<h4 className="font-medium">Validatie</h4>
							<ul className="text-sm text-muted-foreground">
								{Object.entries(validation.counts).map(([tab, n]) => (
									<li key={tab}>
										{tab}: {n} rij(en)
									</li>
								))}
							</ul>
							{validation.errors.length > 0 && (
								<>
									<div className="flex items-center gap-2 text-destructive">
										<LuTriangleAlert className="h-4 w-4" />
										<span className="text-sm">{validation.errors.length} fout(en)</span>
										<Button
											type="button"
											size="sm"
											variant="outline"
											onClick={() => downloadErrors(validation.errors, 'validatie-fouten.csv')}
										>
											Download CSV
										</Button>
									</div>
									<div className="max-h-60 overflow-auto rounded border bg-muted/30 p-2 text-xs">
										{validation.errors.slice(0, 50).map((e) => (
											<div key={`${e.tab}-${e.row}-${e.field ?? ''}-${e.message}`}>
												[{e.tab}] rij {e.row}
												{e.field ? ` · ${e.field}` : ''} — {e.message}
											</div>
										))}

										{validation.errors.length > 50 && (
											<div className="pt-1 italic">
												… nog {validation.errors.length - 50} fout(en)
											</div>
										)}
									</div>
								</>
							)}
						</div>
					)}

					{importResult && (
						<div className="space-y-2 rounded-md border p-4">
							<h4 className="font-medium">Import-resultaat</h4>
							<table className="w-full text-sm">
								<thead className="text-left text-muted-foreground">
									<tr>
										<th className="py-1">Entiteit</th>
										<th className="py-1">Nieuw</th>
										<th className="py-1">Bijgewerkt</th>
										<th className="py-1">Mislukt</th>
									</tr>
								</thead>
								<tbody>
									{importResult.summaries.map((s) => (
										<tr key={s.tab} className="border-t">
											<td className="py-1">{s.tab}</td>
											<td className="py-1">{s.created}</td>
											<td className="py-1">{s.updated}</td>
											<td className="py-1">{s.failed}</td>
										</tr>
									))}
								</tbody>
							</table>
							{importResult.errors.length > 0 && (
								<Button
									type="button"
									size="sm"
									variant="outline"
									onClick={() => downloadErrors(importResult.errors, 'import-fouten.csv')}
								>
									Download foutrapport
								</Button>
							)}
						</div>
					)}
				</CardContent>
			</Card>

			<Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Import bevestigen</DialogTitle>
						<DialogDescription>
							De import is idempotent maar wijzigt productiedata. Bestaande records worden bijgewerkt.
							Doorgaan?
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={busy}>
							Annuleren
						</Button>
						<Button onClick={runImport} disabled={busy}>
							Ja, importeren
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
