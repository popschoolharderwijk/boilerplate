import type { SupabaseClient } from '@supabase/supabase-js';
import { toast } from 'sonner';
import {
	type AnnouncementImageUploadGate,
	resolveAnnouncementImageUploadGate,
} from '@/lib/settings/announcementsManagerControllerHelpers';
import { buildAnnouncementImagePath, isAnnouncementImageFile } from '@/lib/settings/announcementsManagerHelpers';

function resolveAnnouncementImageUploadToast(gate: AnnouncementImageUploadGate): string | null {
	if (gate === 'schema-missing') return 'Nieuwsberichten zijn nog niet beschikbaar';
	if (gate === 'invalid-file') return 'Alleen afbeeldingen zijn toegestaan';
	return null;
}

async function uploadAnnouncementImageFile(
	supabase: SupabaseClient,
	file: File,
): Promise<{ publicUrl: string } | { error: string }> {
	const path = buildAnnouncementImagePath(file.name);
	const { error: uploadError } = await supabase.storage
		.from('announcement-images')
		.upload(path, file, { upsert: false, contentType: file.type });
	if (uploadError) return { error: uploadError.message };

	const {
		data: { publicUrl },
	} = supabase.storage.from('announcement-images').getPublicUrl(path);
	return { publicUrl };
}

function isAnnouncementImageUploadReady(
	file: File | undefined,
	isSchemaMissing: boolean,
): { ready: false; gate: AnnouncementImageUploadGate } | { ready: true; file: File } {
	const gate = resolveAnnouncementImageUploadGate(file, isSchemaMissing);
	if (gate !== 'proceed') return { ready: false, gate };
	if (!file || !isAnnouncementImageFile(file)) {
		return { ready: false, gate: 'invalid-file' };
	}
	return { ready: true, file };
}

function buildAnnouncementImageMarkdown(fileName: string, publicUrl: string): string {
	return `![${fileName}](${publicUrl})`;
}

function showAnnouncementImageUploadError(message: string, description?: string): void {
	toast.error(message, description ? { description } : undefined);
}

type PreparedAnnouncementImageUpload =
	| { status: 'blocked'; gate: AnnouncementImageUploadGate }
	| { status: 'ready'; file: File };

function prepareAnnouncementImageUpload(
	file: File | undefined,
	isSchemaMissing: boolean,
): PreparedAnnouncementImageUpload {
	const uploadReady = isAnnouncementImageUploadReady(file, isSchemaMissing);
	if (uploadReady.ready === false) {
		return { status: 'blocked', gate: uploadReady.gate };
	}
	return { status: 'ready', file: uploadReady.file };
}

async function uploadAndBuildAnnouncementImageMarkdown(
	supabase: SupabaseClient,
	file: File,
): Promise<{ markdown: string } | { error: string }> {
	const uploadResult = await uploadAnnouncementImageFile(supabase, file);
	if ('error' in uploadResult) return { error: uploadResult.error };
	return { markdown: buildAnnouncementImageMarkdown(file.name, uploadResult.publicUrl) };
}

export async function runAnnouncementImageUpload(params: {
	file: File | undefined;
	isSchemaMissing: boolean;
	supabase: SupabaseClient;
	insertAtCursor: (markdown: string) => void;
}): Promise<'uploaded' | 'blocked' | 'failed'> {
	const prepared = prepareAnnouncementImageUpload(params.file, params.isSchemaMissing);
	if (prepared.status === 'blocked') {
		const toastMessage = resolveAnnouncementImageUploadToast(prepared.gate);
		if (toastMessage) showAnnouncementImageUploadError(toastMessage);
		return 'blocked';
	}

	const uploadResult = await uploadAndBuildAnnouncementImageMarkdown(params.supabase, prepared.file);
	if ('error' in uploadResult) {
		showAnnouncementImageUploadError('Upload mislukt', uploadResult.error);
		return 'failed';
	}

	params.insertAtCursor(uploadResult.markdown);
	return 'uploaded';
}
