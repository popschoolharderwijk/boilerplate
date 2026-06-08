import { Navigate } from 'react-router-dom';
import { LegacyImportManager } from '@/components/settings/LegacyImportManager';
import { PageHeader } from '@/components/ui/page-header';
import { PageSkeleton } from '@/components/ui/page-skeleton';
import { NAV_LABELS } from '@/config/nav-labels';
import { useAuth } from '@/hooks/useAuth';

export default function LegacyImportPage() {
	const { isAdmin, isSiteAdmin, isLoading } = useAuth();
	const hasAccess = isAdmin || isSiteAdmin;

	if (isLoading) return <PageSkeleton variant="header-and-cards" />;
	if (!hasAccess) return <Navigate to="/" replace />;

	return (
		<div className="space-y-6">
			<PageHeader title={NAV_LABELS.dataImport} subtitle="Importeer masterdata en actieve overeenkomsten" />
			<LegacyImportManager />
		</div>
	);
}
