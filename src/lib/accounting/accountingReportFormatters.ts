export type AccountingAgeBadgeVariant = 'secondary' | 'outline' | 'default';

export interface AccountingAgeBadge {
	label: string;
	variant: AccountingAgeBadgeVariant;
}

const ACCOUNTING_AGE_BADGE: Record<string, AccountingAgeBadge> = {
	under_21: { label: '<21 vrijgesteld', variant: 'secondary' },
	'21_plus': { label: '21+ BTW 21%', variant: 'outline' },
	unknown: { label: 'Onbekende leeftijd', variant: 'default' },
};

export function getAccountingAgeBadge(ageCategory: string): AccountingAgeBadge {
	return ACCOUNTING_AGE_BADGE[ageCategory] ?? { label: ageCategory, variant: 'default' };
}

export function formatAccountingInvoiceDate(periodStart: string): string {
	return periodStart.slice(0, 10);
}

export function getAccountingStatusBadgeVariant(status: string): 'secondary' | 'outline' {
	return status === 'paid' ? 'secondary' : 'outline';
}
