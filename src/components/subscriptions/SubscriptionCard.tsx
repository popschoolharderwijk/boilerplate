import { useEffect, useState } from 'react';
import { LuCreditCard, LuExternalLink, LuMail, LuRefreshCw } from 'react-icons/lu';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { formatDbDateToUi } from '@/lib/date/date-format';
import {
	SUBSCRIPTION_STATUS_LABELS,
	SUBSCRIPTION_STATUS_VARIANTS,
	type SubscriptionStatus,
} from '@/types/subscriptions';

interface SubscriptionCardProps {
	lessonAgreementId: string;
	/** When true, hides the "Start incasso" action (e.g. on student-facing views). */
	hideStartAction?: boolean;
}

function formatCents(amount: number, currency: string): string {
	return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: currency.toUpperCase() }).format(amount / 100);
}

export function SubscriptionCard({ lessonAgreementId, hideStartAction = false }: SubscriptionCardProps) {
	const { isPrivileged } = useAuth();
	const { subscription, invoices, loading, refresh } = useSubscription(lessonAgreementId);
	const [busy, setBusy] = useState(false);
	const [lastInviteAt, setLastInviteAt] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;
		void supabase
			.from('incasso_invitations')
			.select('sent_at')
			.eq('lesson_agreement_id', lessonAgreementId)
			.order('sent_at', { ascending: false })
			.limit(1)
			.maybeSingle()
			.then(({ data }) => {
				if (!cancelled) setLastInviteAt(data?.sent_at ?? null);
			});
		return () => {
			cancelled = true;
		};
	}, [lessonAgreementId]);

	const handleSendInvite = async () => {
		setBusy(true);
		const { error } = await supabase.functions.invoke('send-incasso-invite', {
			body: { lesson_agreement_id: lessonAgreementId },
		});
		setBusy(false);
		if (error) {
			toast.error(error.message ?? 'Kon uitnodiging niet versturen');
			return;
		}
		setLastInviteAt(new Date().toISOString());
		toast.success('Betaaluitnodiging verstuurd');
	};

	const handleStartCheckout = async (mode: 'checkout' | 'direct') => {
		setBusy(true);
		const { data, error } = await supabase.functions.invoke('create-subscription-checkout', {
			body: { lesson_agreement_id: lessonAgreementId, mode },
		});
		setBusy(false);
		if (error || (data as { error?: string })?.error) {
			toast.error((data as { error?: string })?.error ?? error?.message ?? 'Kon incasso niet starten');
			return;
		}
		if (mode === 'direct') {
			toast.success('Incasso geactiveerd op bestaand mandaat');
			void refresh();
			return;
		}
		const url = (data as { url?: string })?.url;
		if (url) {
			// Open in new tab — Stripe Checkout sets X-Frame-Options: DENY,
			// so navigating the (Lovable preview) iframe results in a black screen.
			const win = window.open(url, '_blank', 'noopener,noreferrer');
			if (!win) {
				// Popup blocked: fall back to top-level navigation.
				try {
					window.top!.location.href = url;
				} catch {
					window.location.href = url;
				}
			}
		}
	};

	const handleOpenPortal = async () => {
		setBusy(true);
		const { data, error } = await supabase.functions.invoke('create-customer-portal', {
			body: {},
		});
		setBusy(false);
		if (error || (data as { error?: string })?.error) {
			toast.error((data as { error?: string })?.error ?? error?.message ?? 'Kon portaal niet openen');
			return;
		}
		const url = (data as { url?: string })?.url;
		if (url) window.open(url, '_blank', 'noopener,noreferrer');
	};

	const handleRebuild = async () => {
		setBusy(true);
		const { data, error } = await supabase.functions.invoke('rebuild-subscription-schedule', {
			body: { lesson_agreement_id: lessonAgreementId },
		});
		setBusy(false);
		if (error || (data as { error?: string })?.error) {
			toast.error((data as { error?: string })?.error ?? error?.message ?? 'Kon tarieven niet bijwerken');
			return;
		}
		const result = (data as { results?: Array<{ ok: boolean; detail?: { updatedPhases?: number } }> })
			?.results?.[0];
		const updated = result?.detail?.updatedPhases ?? 0;
		toast.success(
			updated > 0
				? `Nieuwe tarieven toegepast op ${updated} toekomstige maand(en)`
				: 'Geen toekomstige maanden om bij te werken',
		);
		void refresh();
	};

	const status = subscription?.status as SubscriptionStatus | undefined;

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
				<CardTitle className="flex items-center gap-2 text-base">
					<LuCreditCard className="h-4 w-4" />
					Incasso & abonnement
				</CardTitle>
				<Button variant="ghost" size="sm" onClick={() => void refresh()} disabled={loading || busy}>
					<LuRefreshCw className="h-4 w-4" />
				</Button>
			</CardHeader>
			<CardContent className="space-y-4">
				{!subscription && !loading && (
					<div className="flex flex-col gap-3">
						<p className="text-sm text-muted-foreground">
							Nog geen abonnement gekoppeld aan deze lesovereenkomst.
						</p>
						{!hideStartAction && isPrivileged && (
							<div className="flex flex-wrap gap-2">
								<Button
									onClick={() => handleStartCheckout('checkout')}
									disabled={busy}
									className="w-fit"
								>
									Start incasso (checkout)
								</Button>
								<Button
									onClick={() => handleStartCheckout('direct')}
									disabled={busy}
									variant="outline"
									className="w-fit"
								>
									Activeer op bestaand mandaat
								</Button>
							</div>
						)}
					</div>
				)}

				{subscription && status && (
					<div className="space-y-3">
						<div className="flex items-center gap-2">
							<Badge variant={SUBSCRIPTION_STATUS_VARIANTS[status]}>
								{SUBSCRIPTION_STATUS_LABELS[status]}
							</Badge>
							{subscription.default_payment_method_brand && (
								<span className="text-xs text-muted-foreground">
									via {subscription.default_payment_method_brand.replace('_', ' ')}
								</span>
							)}
						</div>

						{subscription.current_period_end && (
							<p className="text-sm text-muted-foreground">
								Huidige periode tot {formatDbDateToUi(subscription.current_period_end.split('T')[0])}
							</p>
						)}

						<div className="flex flex-wrap gap-2">
							<Button variant="outline" size="sm" onClick={handleOpenPortal} disabled={busy}>
								Beheer betaling
							</Button>
							{isPrivileged && subscription.stripe_schedule_id && (
								<Button
									variant="outline"
									size="sm"
									onClick={handleRebuild}
									disabled={busy}
									title="Herbereken toekomstige maanden met de huidige tarieven"
								>
									Pas nieuwe tarieven toe
								</Button>
							)}
						</div>

						{invoices.length > 0 && (
							<div className="border-t pt-3">
								<p className="mb-2 text-sm font-medium">Facturen</p>
								<ul className="space-y-1.5">
									{invoices.slice(0, 6).map((inv) => (
										<li key={inv.id} className="flex items-center justify-between gap-2 text-sm">
											<span className="text-muted-foreground">
												{inv.period_start
													? formatDbDateToUi(inv.period_start.split('T')[0])
													: '—'}
											</span>
											<span className="flex items-center gap-2">
												<span>{formatCents(inv.amount_due, inv.currency)}</span>
												<Badge
													variant={inv.status === 'paid' ? 'default' : 'secondary'}
													className="text-xs"
												>
													{inv.status}
												</Badge>
												{inv.hosted_invoice_url && (
													<a
														href={inv.hosted_invoice_url}
														target="_blank"
														rel="noopener noreferrer"
														className="text-primary hover:underline"
														aria-label="Open factuur"
													>
														<LuExternalLink className="h-3.5 w-3.5" />
													</a>
												)}
											</span>
										</li>
									))}
								</ul>
							</div>
						)}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
