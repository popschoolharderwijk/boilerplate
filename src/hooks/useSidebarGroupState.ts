import { useEffect, useState } from 'react';
import { BEHEER_OPEN_KEY, FINANCE_OPEN_KEY } from '@/components/layout/sidebar-config';

function readStoredOpen(key: string): boolean {
	if (typeof window === 'undefined') return false;
	const stored = window.localStorage.getItem(key);
	return stored === '1';
}

function persistOpen(key: string, open: boolean): void {
	if (typeof window === 'undefined') return;
	window.localStorage.setItem(key, open ? '1' : '0');
}

export function useSidebarGroupState(isInBeheer: boolean, isInFinance: boolean) {
	const [beheerOpen, setBeheerOpen] = useState(() => readStoredOpen(BEHEER_OPEN_KEY));
	const [financeOpen, setFinanceOpen] = useState(() => readStoredOpen(FINANCE_OPEN_KEY));

	useEffect(() => {
		if (isInBeheer) setBeheerOpen(true);
	}, [isInBeheer]);

	useEffect(() => {
		if (isInFinance) {
			setFinanceOpen(true);
			setBeheerOpen(true);
		}
	}, [isInFinance]);

	useEffect(() => {
		persistOpen(BEHEER_OPEN_KEY, beheerOpen);
	}, [beheerOpen]);

	useEffect(() => {
		persistOpen(FINANCE_OPEN_KEY, financeOpen);
	}, [financeOpen]);

	return { beheerOpen, setBeheerOpen, financeOpen, setFinanceOpen };
}
