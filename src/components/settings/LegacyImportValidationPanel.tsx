import { LuTriangleAlert } from 'react-icons/lu';
import { Button } from '@/components/ui/button';
import type { RowError, ValidationResponse } from '@/lib/settings/legacyImportManagerHelpers';

interface LegacyImportValidationPanelProps {
	validation: ValidationResponse;
	onDownloadErrors: (errors: RowError[], fileName: string) => void;
}

export function LegacyImportValidationPanel({ validation, onDownloadErrors }: LegacyImportValidationPanelProps) {
	return (
		<div className="space-y-2 rounded-md border p-4">
			<h4 className="font-medium">Validatie</h4>
			<ul className="text-sm text-muted-foreground">
				{Object.entries(validation.counts).map(([tab, count]) => (
					<li key={tab}>
						{tab}: {count} rij(en)
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
							onClick={() => onDownloadErrors(validation.errors, 'validatie-fouten.csv')}
						>
							Download CSV
						</Button>
					</div>
					<div className="max-h-60 overflow-auto rounded border bg-muted/30 p-2 text-xs">
						{validation.errors.slice(0, 50).map((error) => (
							<div key={`${error.tab}-${error.row}-${error.field ?? ''}-${error.message}`}>
								[{error.tab}] rij {error.row}
								{error.field ? ` · ${error.field}` : ''} — {error.message}
							</div>
						))}
						{validation.errors.length > 50 && (
							<div className="pt-1 italic">… nog {validation.errors.length - 50} fout(en)</div>
						)}
					</div>
				</>
			)}
		</div>
	);
}
