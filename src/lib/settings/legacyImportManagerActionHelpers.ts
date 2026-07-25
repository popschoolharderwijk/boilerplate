import { toast } from 'sonner';
import type { LegacyImportActionResult } from '@/lib/settings/legacyImportManagerActions';

function applyLegacyImportActionToast(toastResult?: { kind: 'success' | 'warning'; message: string }) {
	if (!toastResult) return;
	if (toastResult.kind === 'success') toast.success(toastResult.message);
	else toast.warning(toastResult.message);
}

function reportLegacyImportActionError(result: Extract<LegacyImportActionResult<unknown>, { ok: false }>) {
	toast.error(result.title, { description: result.message });
}

export async function runLegacyImportAction<T>(
	action: () => Promise<LegacyImportActionResult<T>>,
	onSuccess: (data: T) => void,
): Promise<void> {
	const result = await action();
	if (result.ok === false) {
		reportLegacyImportActionError(result);
		return;
	}
	onSuccess(result.data);
	applyLegacyImportActionToast(result.toast);
}
