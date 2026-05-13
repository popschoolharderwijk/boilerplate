import { Navigate } from 'react-router-dom';
import { EmailTemplatesManager } from '@/components/settings/EmailTemplatesManager';
import { PageHeader } from '@/components/ui/page-header';
import { NAV_ICONS, NAV_LABELS } from '@/config/nav-labels';
import { useAuth } from '@/hooks/useAuth';

export default function EmailTemplates() {
	const { isAdmin, isSiteAdmin, isLoading } = useAuth();
	const Icon = NAV_ICONS.emailTemplates;

	if (isLoading) return null;
	if (!(isAdmin || isSiteAdmin)) return <Navigate to="/" replace />;

	return (
		<div className="space-y-6">
			<PageHeader
				icon={<Icon className="h-6 w-6" />}
				title={NAV_LABELS.emailTemplates}
				subtitle="Beheer de inhoud van automatische e-mails"
			/>
			<EmailTemplatesManager />
		</div>
	);
}
