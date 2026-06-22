export type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'cancelled';
export type InvoiceAgeCategory = 'under_21' | '21_plus' | 'unknown' | 'mixed';

export interface Invoice {
	id: string;
	invoice_number: string;
	student_user_id: string;
	batch_id: string | null;
	issue_date: string;
	due_date: string;
	period_start: string | null;
	period_end: string | null;
	amount_excl_btw_cents: number;
	btw_amount_cents: number;
	amount_total_cents: number;
	age_category: InvoiceAgeCategory;
	status: InvoiceStatus;
	pdf_storage_path: string | null;
	sent_at: string | null;
	paid_at: string | null;
	email_sent_to: string | null;
	notes: string | null;
	created_at: string;
	updated_at: string;
}

export interface InvoiceLine {
	id: string;
	invoice_id: string;
	batch_item_id: string | null;
	description: string;
	lesson_date: string | null;
	quantity: number;
	unit_price_cents: number;
	btw_rate: number;
	amount_excl_btw_cents: number;
	btw_amount_cents: number;
	amount_total_cents: number;
	sort_order: number;
}

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
	draft: 'Concept',
	issued: 'Verstuurd',
	paid: 'Betaald',
	cancelled: 'Geannuleerd',
};

export function formatCentsEUR(cents: number): string {
	return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}
