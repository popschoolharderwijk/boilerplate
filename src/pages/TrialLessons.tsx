import { LuGraduationCap, LuPlus } from 'react-icons/lu';
import { Navigate, useNavigate } from 'react-router-dom';
import { ScheduleTrialLessonDialog } from '@/components/trial-lessons/ScheduleTrialLessonDialog';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { PageHeader } from '@/components/ui/page-header';
import { useAuth } from '@/hooks/useAuth';
import { useTrialLessonsPageController } from '@/hooks/useTrialLessonsPageController';

export default function TrialLessons() {
	const { isPrivileged, isLoading } = useAuth();
	const navigate = useNavigate();
	const controller = useTrialLessonsPageController({ isPrivileged, navigate });

	if (isLoading) return null;
	if (!isPrivileged) return <Navigate to="/" replace />;

	return (
		<>
			<PageHeader
				icon={<LuGraduationCap className="h-6 w-6" />}
				title="Proeflessen"
				subtitle="Plan en beheer proeflessen voor leerlingen"
			/>
			<div className="mt-4 mb-3 flex justify-end">
				<Button onClick={() => controller.setOpenSchedule(true)}>
					<LuPlus className="h-4 w-4 mr-1" /> Proefles inplannen
				</Button>
			</div>
			<div className="mt-6">
				<DataTable
					title="Proeflessen"
					columns={controller.columns}
					data={controller.rows}
					loading={controller.loading}
					getRowKey={(row) => row.id}
					emptyMessage="Nog geen proeflessen ingepland."
				/>
			</div>
			<ScheduleTrialLessonDialog
				open={controller.openSchedule}
				onOpenChange={controller.setOpenSchedule}
				onScheduled={controller.load}
			/>
		</>
	);
}
