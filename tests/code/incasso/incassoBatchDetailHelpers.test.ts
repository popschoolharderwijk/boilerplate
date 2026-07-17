import { describe, expect, it } from 'bun:test';
import {
	canEditBatchItemStatus,
	countInvoiceGenerationResults,
	formatBatchApproveSuccessMessage,
	formatBatchItemStudentName,
	parseIncassoBatchLoadResult,
	resolveIncassoBatchDetailView,
} from '../../../src/lib/incasso/incassoBatchDetailHelpers';

describe('resolveIncassoBatchDetailView', () => {
	it('returns loading while data loads', () => {
		expect(resolveIncassoBatchDetailView(true, null)).toBe('loading');
	});

	it('returns not-found when batch is missing', () => {
		expect(resolveIncassoBatchDetailView(false, null)).toBe('not-found');
	});

	it('returns content when batch exists', () => {
		expect(resolveIncassoBatchDetailView(false, { id: 'batch-1' } as never)).toBe('content');
	});
});

describe('formatBatchItemStudentName', () => {
	it('returns dash when profile is missing', () => {
		expect(formatBatchItemStudentName(null)).toBe('—');
	});

	it('returns full name when available', () => {
		expect(
			formatBatchItemStudentName({
				first_name: 'Anna',
				last_name: 'Jansen',
				email: 'anna@example.com',
			}),
		).toBe('Anna Jansen');
	});

	it('falls back to email when name is empty', () => {
		expect(
			formatBatchItemStudentName({
				first_name: null,
				last_name: null,
				email: 'anna@example.com',
			}),
		).toBe('anna@example.com');
	});
});

describe('countInvoiceGenerationResults', () => {
	it('counts successful and failed invoice results', () => {
		expect(
			countInvoiceGenerationResults([
				{ invoice_number: 'INV-1' },
				{ invoice_number: 'INV-2', error: 'failed' },
				{ error: 'missing number' },
			]),
		).toEqual({ ok: 1, failed: 2 });
	});
});

describe('formatBatchApproveSuccessMessage', () => {
	it('formats success message without failures', () => {
		expect(formatBatchApproveSuccessMessage(2, 0)).toBe('Batch goedgekeurd — 2 factuur/facturen aangemaakt.');
	});

	it('formats success message with failures', () => {
		expect(formatBatchApproveSuccessMessage(1, 2)).toBe(
			'Batch goedgekeurd — 1 factuur/facturen aangemaakt, 2 fout.',
		);
	});
});

describe('canEditBatchItemStatus', () => {
	it('allows editing for submitted and closed batches', () => {
		expect(canEditBatchItemStatus('submitted')).toBe(true);
		expect(canEditBatchItemStatus('closed')).toBe(true);
	});

	it('disallows editing for draft and approved batches', () => {
		expect(canEditBatchItemStatus('draft')).toBe(false);
		expect(canEditBatchItemStatus('approved')).toBe(false);
	});
});

describe('parseIncassoBatchLoadResult', () => {
	it('maps null batch and empty items', () => {
		expect(parseIncassoBatchLoadResult(null, null)).toEqual({ batch: null, items: [] });
	});
});
