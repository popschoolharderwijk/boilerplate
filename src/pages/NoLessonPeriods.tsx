import { Navigate } from 'react-router-dom';
import { NoLessonPeriodsManager } from '@/components/settings/NoLessonPeriodsManager';
import { PageHeader } from '@/components/ui/page-header';
import { NAV_ICONS, NAV_LABELS } from '@/config/nav-labels';
import { useAuth } from '@/hooks/useAuth';

export default function NoLessonPeriods() {
	const { isAdmin, isSiteAdmin, isLoading } = useAuth();
	const Icon = NAV_ICONS.noLessonPeriods;

	if (isLoading) return null;
	if (!(isAdmin || isSiteAdmin)) return <Navigate to="/" replace />;

	return (
		<div className="space-y-6">
			<PageHeader
				icon={<Icon className="h-6 w-6" />}
				title={NAV_LABELS.noLessonPeriods}
				subtitle="Beheer schoolvakanties en andere lesvrije periodes"
			/>
			<NoLessonPeriodsManager />
		</div>
	);
}
