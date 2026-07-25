import type { ApplyReportResult, BatchRow, ParsedReport } from './types.ts';

export function buildImportResponse(
	batch: BatchRow,
	report: ParsedReport,
	result: ApplyReportResult,
): Record<string, unknown> {
	return {
		batch_id: batch.id,
		message_id: report.message_id,
		original_message_id: report.original_message_id,
		group_status: report.group_status,
		processed: report.transactions.length,
		accepted: result.acceptedCount,
		rejected: result.rejectedCount,
		unknown_end_to_end_ids: result.unknown,
		mandates_promoted: result.mandatesPromoted,
		batch_closed: result.batchClosed,
	};
}
