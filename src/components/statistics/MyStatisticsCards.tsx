import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { TeacherStatistics } from '@/lib/statistics/myStatisticsHelpers';

interface MyStatisticsCardsProps {
	stats: TeacherStatistics;
}

export function MyStatisticsCards({ stats }: MyStatisticsCardsProps) {
	return (
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
			<Card>
				<CardHeader>
					<CardTitle>Aantal leerlingen</CardTitle>
					<CardDescription>Unieke leerlingen</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="text-3xl font-bold">{stats.studentCount}</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Lessen per week</CardTitle>
					<CardDescription>Actieve lesovereenkomsten</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="text-3xl font-bold">{stats.lessonsPerWeek}</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Groepslessen</CardTitle>
					<CardDescription>Actieve groepslessen</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="text-3xl font-bold">{stats.groupLessons}</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Aankomende lessen</CardTitle>
					<CardDescription>Geplande lessen</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="text-3xl font-bold">{stats.upcomingLessons}</div>
				</CardContent>
			</Card>
		</div>
	);
}
