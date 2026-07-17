import { Navigate, useNavigate } from 'react-router-dom';
import { LessonGroupDeleteDialog, LessonGroupsTable } from '@/components/lesson-groups/LessonGroupsTable';
import { useAuth } from '@/hooks/useAuth';
import { useLessonGroupsPageController } from '@/hooks/useLessonGroupsPageController';
import {
	resolveLessonGroupDeleteDialogOpen,
	resolveLessonGroupsPageAccess,
	resolveLessonGroupsPageView,
} from '@/lib/lesson-groups/lessonGroupsPageViewHelpers';

export default function LessonGroups() {
	const { isAdmin, isSiteAdmin, isPrivileged, isTeacher, isLoading } = useAuth();
	const { canView, canEdit } = resolveLessonGroupsPageAccess(isAdmin, isSiteAdmin, isPrivileged, isTeacher);
	const pageView = resolveLessonGroupsPageView(isLoading, canView);

	const navigate = useNavigate();
	const { rows, loading, search, setSearch, deleteDialog, setDeleteDialog, confirmDelete, handleSchedule } =
		useLessonGroupsPageController({ isLoading, canView, canEdit, navigate });

	if (pageView === 'redirect') return <Navigate to="/" replace />;

	return (
		<div>
			<LessonGroupsTable
				rows={rows}
				loading={loading}
				search={search}
				onSearchChange={setSearch}
				canEdit={canEdit}
				navigate={navigate}
				onSchedule={(group) => {
					void handleSchedule(group);
				}}
				onDeleteRequest={setDeleteDialog}
			/>
			<LessonGroupDeleteDialog
				group={deleteDialog}
				onOpenChange={(open) => {
					if (!resolveLessonGroupDeleteDialogOpen(open)) setDeleteDialog(null);
				}}
				onConfirm={confirmDelete}
			/>
		</div>
	);
}
