import type { SupabaseClient } from '@supabase/supabase-js';
import { toast } from 'sonner';
import {
	buildNoLessonPeriodPayload,
	type NoLessonPeriodFormInput,
	type NoLessonPeriodSaveMode,
	resolveNoLessonPeriodDeleteOutcome,
	resolveNoLessonPeriodSaveErrorToast,
	resolveNoLessonPeriodSaveSuccessToast,
} from '@/lib/settings/noLessonPeriodsManagerHelpers';

export interface NoLessonPeriodListItem {
	id: string;
	name: string;
	start_date: string;
	end_date: string;
	description: string | null;
}

export type NoLessonPeriodSaveOperation = NoLessonPeriodSaveMode;

export function resolveNoLessonPeriodSaveOperation(
	editing: NoLessonPeriodListItem | null,
): NoLessonPeriodSaveOperation {
	return editing ? 'update' : 'create';
}

export function shouldBlockNoLessonPeriodSave(isFormValid: boolean): boolean {
	return !isFormValid;
}

export interface ExecuteNoLessonPeriodSaveParams {
	isFormValid: boolean;
	form: NoLessonPeriodFormInput;
	editing: NoLessonPeriodListItem | null;
	supabase: SupabaseClient;
}

export type NoLessonPeriodSaveOutcome = 'blocked' | 'success' | 'error';

export async function executeNoLessonPeriodSave(
	params: ExecuteNoLessonPeriodSaveParams,
): Promise<NoLessonPeriodSaveOutcome> {
	if (shouldBlockNoLessonPeriodSave(params.isFormValid)) {
		return 'blocked';
	}

	const payload = buildNoLessonPeriodPayload(params.form);
	const mode = resolveNoLessonPeriodSaveOperation(params.editing);
	const { error } = params.editing
		? await params.supabase.from('no_lesson_periods').update(payload).eq('id', params.editing.id)
		: await params.supabase.from('no_lesson_periods').insert(payload);

	if (error) {
		toast.error(resolveNoLessonPeriodSaveErrorToast(mode));
		return 'error';
	}

	toast.success(resolveNoLessonPeriodSaveSuccessToast(mode));
	return 'success';
}

export interface ExecuteNoLessonPeriodDeleteParams {
	deleteTarget: NoLessonPeriodListItem;
	supabase: SupabaseClient;
}

export type NoLessonPeriodDeleteOutcomeKind = 'success' | 'error';

export async function executeNoLessonPeriodDelete(
	params: ExecuteNoLessonPeriodDeleteParams,
): Promise<NoLessonPeriodDeleteOutcomeKind> {
	const { data, error } = await params.supabase
		.from('no_lesson_periods')
		.delete()
		.eq('id', params.deleteTarget.id)
		.select('id');
	const outcome = resolveNoLessonPeriodDeleteOutcome(error, data);
	if (outcome === 'error') {
		toast.error('Lesvrije periode niet verwijderd', {
			description: 'Geen rechten om deze periode te verwijderen.',
		});
		return 'error';
	}

	toast.success('Lesvrije periode verwijderd');
	return 'success';
}

export type NoLessonPeriodFetchOutcome = { kind: 'success'; periods: NoLessonPeriodListItem[] } | { kind: 'error' };

export async function executeNoLessonPeriodFetch(supabase: SupabaseClient): Promise<NoLessonPeriodFetchOutcome> {
	const { data, error } = await supabase
		.from('no_lesson_periods')
		.select('id, name, start_date, end_date, description')
		.order('start_date', { ascending: true });
	if (error) {
		toast.error('Fout bij laden lesvrije periodes');
		return { kind: 'error' };
	}
	return { kind: 'success', periods: data ?? [] };
}
