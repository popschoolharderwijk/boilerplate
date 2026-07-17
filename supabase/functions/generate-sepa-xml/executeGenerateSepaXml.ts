import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { buildSepaXml } from './buildSepaXml.ts';
import { loadSepaXmlContext } from './loadSepaXmlContext.ts';
import { uploadAndFinalizeBatch } from './uploadAndFinalizeBatch.ts';

export async function executeGenerateSepaXml(admin: SupabaseClient, batchId: string): Promise<Response> {
	const loaded = await loadSepaXmlContext(admin, batchId);
	if (!loaded.ok) return loaded.response;

	const { xml, msgId } = buildSepaXml(loaded.context.settings, loaded.context.batch, loaded.context.items);

	return uploadAndFinalizeBatch(admin, {
		batchId,
		batch: loaded.context.batch,
		items: loaded.context.items,
		xml,
		msgId,
	});
}
