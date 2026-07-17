type Tab = 'lesson_types' | 'lesson_type_options' | 'teachers' | 'students' | 'lesson_agreements';

export interface RowError {
	tab: Tab;
	row: number;
	field?: string;
	message: string;
}

export interface ValidationResponse {
	ok: boolean;
	errors: RowError[];
	counts: Record<Tab, number>;
}

export interface ImportSummary {
	tab: Tab;
	created: number;
	updated: number;
	failed: number;
}

export interface ImportResponse {
	ok: boolean;
	summaries: ImportSummary[];
	errors: RowError[];
	counts: Record<Tab, number>;
}

export function fileToBase64(file: File): Promise<string> {
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

export function errorsToCsv(errors: RowError[]): string {
	const header = 'tab,row,field,message\n';
	const csvEscape = (v: string) => `"${v.replace(/"/g, '""')}"`;
	return (
		header +
		errors
			.map((error) =>
				[error.tab, error.row, error.field ?? '', error.message].map((v) => csvEscape(String(v))).join(','),
			)
			.join('\n')
	);
}

export function downloadBlobFile(blob: Blob, fileName: string): void {
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement('a');
	anchor.href = url;
	anchor.download = fileName;
	anchor.click();
	URL.revokeObjectURL(url);
}

export async function fetchLegacyImportTemplate(accessToken: string): Promise<Blob> {
	const SUPABASE_URL = 'https://zdvscmogkfyddnnxzkdu.supabase.co';
	const response = await fetch(`${SUPABASE_URL}/functions/v1/import-legacy-data`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${accessToken}`,
			apikey: accessToken,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ action: 'template' }),
	});
	if (!response.ok) {
		const text = await response.text();
		throw new Error(text || `HTTP ${response.status}`);
	}
	return response.blob();
}
export function resolveLegacyValidationToast(data: ValidationResponse | null): {
	kind: 'success' | 'warning';
	message: string;
} {
	if (data?.ok) return { kind: 'success', message: 'Validatie geslaagd — klaar om te importeren' };
	return { kind: 'warning', message: `Validatie meldt ${data?.errors.length ?? 0} fout(en)` };
}

export function resolveLegacyImportToast(data: ImportResponse | null): {
	kind: 'success' | 'warning';
	message: string;
} {
	if (data?.ok) return { kind: 'success', message: 'Import voltooid' };
	return { kind: 'warning', message: `Import voltooid met ${data?.errors.length ?? 0} fout(en)` };
}

export function toErrorMessage(error: unknown): string {
	return error instanceof Error ? error.message : 'Onbekend';
}
