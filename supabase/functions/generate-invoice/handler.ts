import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getSafeErrorMessage } from '../_shared/errors.ts';
import { beginAuthenticatedPostRequest, jsonResponse } from '../_shared/http.ts';
import {
	buildGenerateInvoiceSuccessPayload,
	readGenerateInvoiceEnv,
	resolveGenerateInvoiceIssueDate,
	resolveGenerateInvoiceMissingBatchError,
	resolveGenerateInvoiceSendEmail,
} from './generateInvoiceHandlerPure.ts';
import { computeDueDate, verifyAdminAccess } from './invoiceHelpers.ts';
import { loadBatchContext } from './loadBatchContext.ts';
import { processStudentInvoice } from './processStudentInvoice.ts';
import type { Body } from './types.ts';

function createGenerateInvoiceAdminClient(env: ReturnType<typeof readGenerateInvoiceEnv>) {
	return createClient(env.supabaseUrl, env.serviceKey, {
		auth: { autoRefreshToken: false, persistSession: false },
	});
}

async function processGenerateInvoiceBatch(
	admin: ReturnType<typeof createGenerateInvoiceAdminClient>,
	batchId: string,
	body: Body,
) {
	const loaded = await loadBatchContext(admin, batchId);
	if (!loaded.ok) return loaded.response;
	const { context } = loaded;

	const issueDate = resolveGenerateInvoiceIssueDate(new Date());
	const dueDate = computeDueDate(context.settings.invoice_payment_term_days);
	const sendEmail = resolveGenerateInvoiceSendEmail(body.send_email);

	const results = [];
	for (const sid of context.studentIds) {
		const result = await processStudentInvoice({
			admin,
			batchId,
			batch: context.batch,
			settings: context.settings,
			studentUserId: sid,
			items: context.items,
			profileMap: context.profileMap,
			studentMap: context.studentMap,
			mandateMap: context.mandateMap,
			issueDate,
			dueDate,
			sendEmail,
		});
		results.push(result);
	}

	return jsonResponse(200, buildGenerateInvoiceSuccessPayload(batchId, results));
}

export async function handleGenerateInvoiceRequest(req: Request): Promise<Response> {
	try {
		const begun = await beginAuthenticatedPostRequest<Body>(req);
		if (!begun.ok) return begun.response;
		const { authHeader, body } = begun;
		if (!body.batch_id) {
			const missingBatch = resolveGenerateInvoiceMissingBatchError();
			return jsonResponse(missingBatch.status, { error: missingBatch.error });
		}

		const env = readGenerateInvoiceEnv((key) => Deno.env.get(key));
		const authError = await verifyAdminAccess(authHeader, env.supabaseUrl, env.anonKey, env.serviceKey);
		if (authError) return authError;

		const admin = createGenerateInvoiceAdminClient(env);
		return await processGenerateInvoiceBatch(admin, body.batch_id, body);
	} catch (err) {
		console.error('generate-invoice failed', err);
		return jsonResponse(500, { error: getSafeErrorMessage(err) });
	}
}
