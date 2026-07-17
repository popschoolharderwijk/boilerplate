import { PostgresErrorCodes } from '@/integrations/supabase/errorcodes';

export type ProjectDomainSaveMode = 'create' | 'update';

export function shouldBlockProjectDomainSave(name: string): boolean {
	return name.trim().length === 0;
}

export function resolveProjectDomainSaveOperation(editing: { id: string } | null): ProjectDomainSaveMode {
	return editing ? 'update' : 'create';
}

export function resolveProjectDomainSaveErrorToast(mode: ProjectDomainSaveMode): string {
	return mode === 'update' ? 'Fout bij bijwerken domein' : 'Fout bij aanmaken domein';
}

export function resolveProjectDomainSaveSuccessToast(mode: ProjectDomainSaveMode): string {
	return mode === 'update' ? 'Domein bijgewerkt' : 'Domein aangemaakt';
}

export type ProjectDomainDeleteOutcome = 'success' | 'error-linked' | 'error-no-rights';

export function resolveProjectDomainDeleteOutcome(
	error: { code?: string } | null,
	deletedRows: { id: string }[] | null | undefined,
): ProjectDomainDeleteOutcome {
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

export function resolveProjectDomainDeleteNotDeletedDescription(outcome: ProjectDomainDeleteOutcome): string {
	if (outcome === 'error-linked') {
		return 'Er zijn nog labels aan dit domein gekoppeld. Verwijder eerst die labels of koppel ze aan een ander domein.';
	}
	return 'Geen rechten om dit domein te verwijderen.';
}
