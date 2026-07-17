interface InvoiceSearchProfile {
	first_name: string | null;
	last_name: string | null;
	email: string;
}

export interface InvoiceSearchRow {
	invoice_number: string;
	profiles?: InvoiceSearchProfile | null;
}

export function buildInvoiceStudentSearchName(profile: InvoiceSearchProfile | null | undefined): string {
	return `${profile?.first_name ?? ''} ${profile?.last_name ?? ''}`.toLowerCase();
}

export function matchesInvoiceSearch(row: InvoiceSearchRow, search: string): boolean {
	if (!search) return true;
	const query = search.toLowerCase();
	const name = buildInvoiceStudentSearchName(row.profiles);
	return (
		row.invoice_number.toLowerCase().includes(query) ||
		name.includes(query) ||
		(row.profiles?.email ?? '').toLowerCase().includes(query)
	);
}
