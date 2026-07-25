import { Navigate } from 'react-router-dom';
import { StudentsPageContent } from '@/components/students/StudentsPageContent';
import { useStudentsPage } from '@/hooks/useStudentsPage';

export default function Students() {
	const page = useStudentsPage();

	if (!page.authLoading && !page.hasAccess) {
		return <Navigate to="/" replace />;
	}

	return (
		<StudentsPageContent
			isPrivileged={page.isPrivileged}
			isAdmin={page.isAdmin}
			isSiteAdmin={page.isSiteAdmin}
			tableState={page.tableState}
			controller={page.controller}
		/>
	);
}
