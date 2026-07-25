import { AdminSiteGuard } from '@/components/auth/AdminSiteGuard';
import { AccountingSettingsManager } from '@/components/settings/AccountingSettingsManager';
import { PageHeader } from '@/components/ui/page-header';

export default function AccountingSettingsPage() {
	return (
		<AdminSiteGuard>
			<div className="space-y-6">
				<PageHeader title="Boekhouding-instellingen" subtitle="Rekeningen, BTW en kostenplaatsen voor Exact" />
				<AccountingSettingsManager />
			</div>
		</AdminSiteGuard>
	);
}
