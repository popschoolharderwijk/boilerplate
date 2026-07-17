import { Navigate } from 'react-router-dom';
import { MyStatisticsCards } from '@/components/statistics/MyStatisticsCards';
import { PageSkeleton } from '@/components/ui/page-skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useMyStatisticsPage } from '@/hooks/useMyStatisticsPage';
import { shouldRedirectMyStatistics, shouldShowMyStatisticsSkeleton } from '@/lib/statistics/myStatisticsPageHelpers';

export default function MyStatistics() {
	const { isTeacher, teacherUserId, isLoading: authLoading } = useAuth();
	const { loading, stats } = useMyStatisticsPage({ authLoading, isTeacher, teacherUserId });

	if (shouldRedirectMyStatistics(authLoading, isTeacher)) {
		return <Navigate to="/" replace />;
	}

	if (shouldShowMyStatisticsSkeleton(authLoading, loading)) {
		return <PageSkeleton variant="header-and-cards" />;
	}

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-bold">Mijn Statistieken</h1>
				<p className="text-muted-foreground">Overzicht van je lesactiviteiten</p>
			</div>
			<MyStatisticsCards stats={stats} />
		</div>
	);
}
