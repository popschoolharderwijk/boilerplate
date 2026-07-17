import type { SupabaseClient } from '@supabase/supabase-js';
import { toast } from 'sonner';
import type { AnnouncementAudience } from '@/hooks/useAnnouncements';
import { buildAnnouncementSavePayload, isAnnouncementImageFile } from '@/lib/settings/announcementsManagerHelpers';

export type AnnouncementImageUploadGate = 'proceed' | 'schema-missing' | 'invalid-file' | 'no-file';

export function resolveAnnouncementImageUploadGate(
	file: File | undefined,
	isSchemaMissing: boolean,
): AnnouncementImageUploadGate {
	if (!file) return 'no-file';
	if (isSchemaMissing) return 'schema-missing';
	if (!isAnnouncementImageFile(file)) return 'invalid-file';
	return 'proceed';
}

export type AnnouncementSaveOperation = 'insert' | 'update';

export function resolveAnnouncementSaveOperation(editingId: string | undefined): AnnouncementSaveOperation {
	return editingId ? 'update' : 'insert';
}

export function shouldBlockAnnouncementSave(isFormValid: boolean, isSchemaMissing: boolean): boolean {
	return !isFormValid || isSchemaMissing;
}

export interface AnnouncementSaveParams {
	isFormValid: boolean;
	isSchemaMissing: boolean;
	form: { title: string; body: string; publish: boolean };
	audience: AnnouncementAudience[];
	editingId: string | undefined;
	editingPublishedAt: string | null | undefined;
	supabase: SupabaseClient;
	setSaving: (saving: boolean) => void;
	setDialogOpen: (open: boolean) => void;
	refetch: () => Promise<void>;
}

export function resolveAnnouncementSaveErrorMessage(operation: AnnouncementSaveOperation): string {
	return operation === 'update' ? 'Opslaan mislukt' : 'Aanmaken mislukt';
}

export function resolveAnnouncementSaveSuccessMessage(operation: AnnouncementSaveOperation): string {
	return operation === 'update' ? 'Bericht bijgewerkt' : 'Bericht aangemaakt';
}

export async function persistAnnouncementSave(
	supabase: SupabaseClient,
	operation: AnnouncementSaveOperation,
	editingId: string | undefined,
	payload: ReturnType<typeof buildAnnouncementSavePayload>,
) {
	return operation === 'update'
		? await supabase
				.from('announcements')
				.update(payload)
				.eq('id', editingId ?? '')
		: await supabase.from('announcements').insert(payload);
}

export async function runAnnouncementSave(params: AnnouncementSaveParams): Promise<void> {
	if (shouldBlockAnnouncementSave(params.isFormValid, params.isSchemaMissing)) {
		if (params.isSchemaMissing) {
			toast.error('Nieuwsberichten zijn nog niet beschikbaar');
		}
		return;
	}
	params.setSaving(true);
	const payload = buildAnnouncementSavePayload({
		title: params.form.title,
		body: params.form.body,
		audience: params.audience,
		publish: params.form.publish,
		existingPublishedAt: params.editingPublishedAt,
	});
	const saveOperation = resolveAnnouncementSaveOperation(params.editingId);
	const saveResult = await persistAnnouncementSave(params.supabase, saveOperation, params.editingId, payload);

	if (saveResult.error) {
		toast.error(resolveAnnouncementSaveErrorMessage(saveOperation), {
			description: saveResult.error.message,
		});
	} else {
		toast.success(resolveAnnouncementSaveSuccessMessage(saveOperation));
		params.setDialogOpen(false);
		await params.refetch();
	}
	params.setSaving(false);
}
