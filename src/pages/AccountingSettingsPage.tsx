import { Navigate } from 'react-router-dom';
import { AccountingSettingsManager } from '@/components/settings/AccountingSettingsManager';
import { PageHeader } from '@/components/ui/page-header';
import { PageSkeleton } from '@/components/ui/page-skeleton';
import { useAuth } from '@/hooks/useAuth';

export default function AccountingSettingsPage() {
	const { isAdmin, isSiteAdmin, isLoading } = useAuth();
	const hasAccess = isAdmin || isSiteAdmin;

	if (isLoading) return <PageSkeleton variant="header-and-cards" />;
	if (!hasAccess) return <Navigate to="/" replace />;

	return (
		<div className="space-y-6">
			<PageHeader title="Boekhouding-instellingen" subtitle="Rekeningen, BTW en kostenplaatsen voor Exact" />
			<AccountingSettingsManager />
		</div>
	);
}
