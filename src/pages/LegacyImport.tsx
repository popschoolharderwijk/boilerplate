import { AdminSiteGuard } from '@/components/auth/AdminSiteGuard';
import { LegacyImportManager } from '@/components/settings/LegacyImportManager';
import { PageHeader } from '@/components/ui/page-header';
import { NAV_LABELS } from '@/config/nav-labels';

export default function LegacyImportPage() {
	return (
		<AdminSiteGuard>
			<div className="space-y-6">
				<PageHeader title={NAV_LABELS.dataImport} subtitle="Importeer masterdata en actieve overeenkomsten" />
				<LegacyImportManager />
			</div>
		</AdminSiteGuard>
	);
}
