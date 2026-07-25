import { LuUsers } from 'react-icons/lu';
import { Link, useNavigate } from 'react-router-dom';
import { DashboardListCardSkeleton } from '@/components/dashboard/DashboardListCardSkeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DashboardStudent } from '@/hooks/useDashboardData';
import { formatDateTimeShort } from '@/lib/date/date-format';

interface RecentStudentsProps {
	students: DashboardStudent[];
	isLoading?: boolean;
}

function getStatusBadge(status: string) {
	switch (status) {
		case 'active':
			return <Badge variant="default">Actief</Badge>;
		case 'trial':
			return <Badge variant="secondary">Proefles</Badge>;
		case 'inactive':
			return <Badge variant="outline">Inactief</Badge>;
		default:
			return null;
	}
}

export function RecentStudents({ students, isLoading = false }: RecentStudentsProps) {
	const navigate = useNavigate();

	if (isLoading) {
		return (
			<DashboardListCardSkeleton
				icon={<LuUsers className="h-5 w-5 text-primary" />}
				titleWidthClass="w-32"
				itemKeyPrefix="student-skeleton"
			/>
		);
	}

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between pb-2">
				<div className="flex items-center gap-2">
					<LuUsers className="h-5 w-5 text-primary" />
					<CardTitle className="text-base font-semibold">Recente Leerlingen</CardTitle>
				</div>
				<Button variant="ghost" size="sm" asChild>
					<Link to="/students">Alle leerlingen</Link>
				</Button>
			</CardHeader>
			<CardContent>
				{students.length === 0 ? (
					<p className="text-sm text-muted-foreground">Geen leerlingen gevonden.</p>
				) : (
					<div className="space-y-3">
						{students.map((student) => (
							<button
								key={student.user_id}
								type="button"
								className="w-full flex items-center justify-between rounded-lg p-2 hover:bg-muted/50 cursor-pointer transition-colors text-left"
								onClick={() => navigate('/students')}
							>
								<div className="flex items-center gap-3">
									<Avatar className="h-9 w-9">
										<AvatarFallback className="bg-muted text-muted-foreground text-xs">
											{student.display_name.slice(0, 2).toUpperCase()}
										</AvatarFallback>
									</Avatar>
									<div>
										<p className="text-sm font-medium leading-tight">{student.display_name}</p>
										<p className="text-xs text-muted-foreground">{student.email}</p>
									</div>
								</div>
								<div className="flex items-center gap-2">
									{getStatusBadge(student.status)}
									<span className="text-xs text-muted-foreground hidden sm:inline">
										{student.created_at ? formatDateTimeShort(new Date(student.created_at)) : ''}
									</span>
								</div>
							</button>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
