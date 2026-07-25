import { LuFileSpreadsheet } from 'react-icons/lu';
import { LegacyImportCardContent } from '@/components/settings/LegacyImportCardContent';
import { LegacyImportConfirmDialog } from '@/components/settings/LegacyImportConfirmDialog';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLegacyImportManager } from '@/hooks/useLegacyImportManager';

export function LegacyImportManager() {
	const {
		file,
		busy,
		validation,
		importResult,
		confirmOpen,
		setConfirmOpen,
		handleFileChange,
		downloadErrors,
		downloadTemplate,
		validate,
		runImport,
	} = useLegacyImportManager();

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
				<LegacyImportCardContent
					file={file}
					busy={busy}
					validation={validation}
					importResult={importResult}
					onFileChange={handleFileChange}
					onDownloadTemplate={downloadTemplate}
					onValidate={validate}
					onOpenConfirm={() => setConfirmOpen(true)}
					onDownloadErrors={downloadErrors}
				/>
			</Card>

			<LegacyImportConfirmDialog
				open={confirmOpen}
				busy={busy}
				onOpenChange={setConfirmOpen}
				onConfirm={runImport}
			/>
		</div>
	);
}
