import { PostgresErrorCodes } from '@/integrations/supabase/errorcodes';

export type ProjectLabelSaveMode = 'create' | 'update';

export function shouldBlockProjectLabelSave(name: string, domainId: string): boolean {
	return name.trim().length === 0 || domainId.length === 0;
}

export function resolveProjectLabelSaveOperation(editing: { id: string } | null): ProjectLabelSaveMode {
	return editing ? 'update' : 'create';
}

export function resolveProjectLabelSaveErrorToast(mode: ProjectLabelSaveMode): string {
	return mode === 'update' ? 'Fout bij bijwerken label' : 'Fout bij aanmaken label';
}

export function resolveProjectLabelSaveSuccessToast(mode: ProjectLabelSaveMode): string {
	return mode === 'update' ? 'Label bijgewerkt' : 'Label aangemaakt';
}

export type ProjectLabelDeleteOutcome = 'success' | 'error-no-rights' | 'error-linked' | 'blocked-linked';

export function resolveProjectLabelDeleteOutcome(
	error: { code?: string } | null,
	deletedRows: { id: string }[] | null | undefined,
): ProjectLabelDeleteOutcome {
	if (error?.code === PostgresErrorCodes.FOREIGN_KEY_VIOLATION) {
		return 'error-linked';
	}
	if (error) {
		return 'error-no-rights';
	}
	if (!deletedRows?.length) {
		return 'error-no-rights';
	}
	return 'success';
}

export function hasLinkedProjectsForLabel(linkedProjects: { id: string }[] | null | undefined): boolean {
	return (linkedProjects?.length ?? 0) > 0;
}
