import type { IncassoBatch } from '@/lib/incasso/types';

export type IncassoBatchTableView = 'loading' | 'empty' | 'table';

export function resolveIncassoBatchTableView(loading: boolean, rowCount: number): IncassoBatchTableView {
	if (loading) return 'loading';
	if (rowCount === 0) return 'empty';
	return 'table';
}

export function computeDefaultCollectionDate(defaultCollectionDay: number, now = new Date()): string {
	const year = now.getFullYear();
	const month = now.getMonth() + 1;
	return `${year}-${String(month).padStart(2, '0')}-${String(defaultCollectionDay).padStart(2, '0')}`;
}

export function buildIncassoBatchNumber(collectionDate: string): string {
	const yyyymm = collectionDate.slice(0, 7).replace('-', '');
	const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
	return `INC-${yyyymm}-${suffix}`;
}

export function mapIncassoBatchRows(data: unknown): IncassoBatch[] {
	return (data ?? []) as IncassoBatch[];
}
