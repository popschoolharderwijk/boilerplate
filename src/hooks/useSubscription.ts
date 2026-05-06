import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { SubscriptionInvoiceRow, SubscriptionRow } from '@/types/subscriptions';

interface UseSubscriptionResult {
	subscription: SubscriptionRow | null;
	invoices: SubscriptionInvoiceRow[];
	loading: boolean;
	refresh: () => Promise<void>;
}

/**
 * Fetches the (latest) subscription + invoices for a given lesson_agreement_id.
 * RLS ensures only the right users see the rows.
 */
export function useSubscription(lessonAgreementId: string | null | undefined): UseSubscriptionResult {
	const [subscription, setSubscription] = useState<SubscriptionRow | null>(null);
	const [invoices, setInvoices] = useState<SubscriptionInvoiceRow[]>([]);
	const [loading, setLoading] = useState(false);

	const load = useCallback(async () => {
		if (!lessonAgreementId) {
			setSubscription(null);
			setInvoices([]);
			return;
		}
		setLoading(true);
		const { data: subs } = await supabase
			.from('subscriptions')
			.select('*')
			.eq('lesson_agreement_id', lessonAgreementId)
			.order('created_at', { ascending: false })
			.limit(1);
		const sub = subs?.[0] ?? null;
		setSubscription(sub);

		if (sub) {
			const { data: invs } = await supabase
				.from('subscription_invoices')
				.select('*')
				.eq('subscription_id', sub.id)
				.order('period_start', { ascending: false });
			setInvoices(invs ?? []);
		} else {
			setInvoices([]);
		}
		setLoading(false);
	}, [lessonAgreementId]);

	useEffect(() => {
		void load();
	}, [load]);

	return { subscription, invoices, loading, refresh: load };
}
