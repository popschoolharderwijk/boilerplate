import { Button } from '@/components/ui/button';
import type { ImportResponse, RowError } from '@/lib/settings/legacyImportManagerHelpers';

interface LegacyImportResultPanelProps {
	importResult: ImportResponse;
	onDownloadErrors: (errors: RowError[], fileName: string) => void;
}

export function LegacyImportResultPanel({ importResult, onDownloadErrors }: LegacyImportResultPanelProps) {
	return (
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
					{importResult.summaries.map((summary) => (
						<tr key={summary.tab} className="border-t">
							<td className="py-1">{summary.tab}</td>
							<td className="py-1">{summary.created}</td>
							<td className="py-1">{summary.updated}</td>
							<td className="py-1">{summary.failed}</td>
						</tr>
					))}
				</tbody>
			</table>
			{importResult.errors.length > 0 && (
				<Button
					type="button"
					size="sm"
					variant="outline"
					onClick={() => onDownloadErrors(importResult.errors, 'import-fouten.csv')}
				>
					Download foutrapport
				</Button>
			)}
		</div>
	);
}
