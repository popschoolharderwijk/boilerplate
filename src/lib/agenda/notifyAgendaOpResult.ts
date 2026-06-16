import { toast } from 'sonner';

export type AgendaOpResult = { ok: boolean; message: string };

export async function notifyAgendaOpResult(
	result: AgendaOpResult,
	onSuccess?: () => void | Promise<void>,
	options?: { throwOnError?: boolean },
): Promise<boolean> {
	if (!result.ok) {
		toast.error(result.message);
		if (options?.throwOnError) throw new Error(result.message);
		return false;
	}
	if (result.message) toast.success(result.message);
	await onSuccess?.();
	return true;
}
